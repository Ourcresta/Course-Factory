import type { Express, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { db } from './db';
import { 
  rewardApprovals, 
  motivationRules, 
  approvalPolicies,
  fraudFlags,
  walletFreezes,
  rewardOverrides,
  riskScores,
  adminActionLogs,
  scholarships,
  shishyaUsers,
  coinWallets,
  coinTransactions,
  users
} from '@shared/schema';
import { eq, desc, and, or, gte, lte, sql, count } from 'drizzle-orm';
import { verifyToken } from './auth-middleware';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
    email: string;
    role: string;
  };
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = payload;
  next();
}

function requireAdminOrHigher(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!['admin', 'super_admin', 'guru'].includes(req.user?.role || '')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

async function logAdminAction(
  adminId: string, 
  actionType: string, 
  entityType: string, 
  entityId: string | null,
  previousState: any,
  newState: any,
  reason?: string,
  req?: Request
) {
  await db.insert(adminActionLogs).values({
    adminId,
    actionType,
    entityType,
    entityId,
    previousState,
    newState,
    reason,
    ipAddress: req?.ip || null,
    userAgent: req?.get('user-agent') || null,
  });
}

export function registerGovernanceRoutes(app: Express) {
  
  // ==================== REWARD APPROVAL QUEUE ====================
  
  app.get('/api/governance/approvals', requireAuth, requireAdminOrHigher, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status, rewardType, flagged, limit = '50', offset = '0' } = req.query;
      
      let query = db.select({
        approval: rewardApprovals,
        user: shishyaUsers,
        rule: motivationRules,
        reviewer: users,
      })
      .from(rewardApprovals)
      .leftJoin(shishyaUsers, eq(rewardApprovals.shishyaUserId, shishyaUsers.id))
      .leftJoin(motivationRules, eq(rewardApprovals.ruleId, motivationRules.id))
      .leftJoin(users, eq(rewardApprovals.reviewedBy, users.id))
      .orderBy(desc(rewardApprovals.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

      const results = await query;
      
      let filtered = results;
      if (status) {
        filtered = filtered.filter(r => r.approval.status === status);
      }
      if (rewardType) {
        filtered = filtered.filter(r => r.approval.rewardType === rewardType);
      }
      if (flagged === 'true') {
        filtered = filtered.filter(r => r.approval.isFlagged);
      }

      const formattedResults = filtered.map(r => ({
        ...r.approval,
        student: r.user ? {
          id: r.user.id,
          name: r.user.name,
          email: r.user.email,
        } : null,
        ruleName: r.rule?.name || null,
        reviewerName: r.reviewer?.username || null,
      }));

      res.json(formattedResults);
    } catch (error) {
      console.error('[Governance] Error fetching approvals:', error);
      res.status(500).json({ error: 'Failed to fetch reward approvals' });
    }
  });

  app.get('/api/governance/approvals/stats', requireAuth, requireAdminOrHigher, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const [pending] = await db.select({ count: count() }).from(rewardApprovals).where(eq(rewardApprovals.status, 'pending'));
      const [flagged] = await db.select({ count: count() }).from(rewardApprovals).where(and(eq(rewardApprovals.status, 'pending'), eq(rewardApprovals.isFlagged, true)));
      const [approved] = await db.select({ count: count() }).from(rewardApprovals).where(eq(rewardApprovals.status, 'approved'));
      const [rejected] = await db.select({ count: count() }).from(rewardApprovals).where(eq(rewardApprovals.status, 'rejected'));
      
      const [highValue] = await db.select({ count: count() }).from(rewardApprovals)
        .where(and(eq(rewardApprovals.status, 'pending'), gte(rewardApprovals.originalValue, 500)));

      res.json({
        pending: pending?.count || 0,
        flagged: flagged?.count || 0,
        approved: approved?.count || 0,
        rejected: rejected?.count || 0,
        highValue: highValue?.count || 0,
      });
    } catch (error) {
      console.error('[Governance] Error fetching approval stats:', error);
      res.status(500).json({ error: 'Failed to fetch approval stats' });
    }
  });

  app.post('/api/governance/approvals/:id/approve', requireAuth, requireAdminOrHigher, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { adjustedValue, notes } = req.body;

      const [existing] = await db.select().from(rewardApprovals).where(eq(rewardApprovals.id, id));
      if (!existing) {
        return res.status(404).json({ error: 'Approval not found' });
      }

      if (existing.status !== 'pending') {
        return res.status(400).json({ error: 'This reward has already been processed' });
      }

      const [frozen] = await db.select().from(walletFreezes)
        .where(and(eq(walletFreezes.shishyaUserId, existing.shishyaUserId), eq(walletFreezes.isActive, true)));
      
      if (frozen) {
        return res.status(400).json({ error: 'User wallet is frozen. Cannot approve rewards.' });
      }

      const finalValue = adjustedValue !== undefined ? adjustedValue : existing.originalValue;

      const [wallet] = await db.select().from(coinWallets).where(eq(coinWallets.shishyaUserId, existing.shishyaUserId));
      
      let transactionId = null;
      if (existing.rewardType === 'coins' && wallet) {
        const newBalance = wallet.balance + finalValue;
        await db.update(coinWallets)
          .set({ 
            balance: newBalance, 
            lifetimeEarned: wallet.lifetimeEarned + finalValue,
            updatedAt: new Date()
          })
          .where(eq(coinWallets.id, wallet.id));

        const [transaction] = await db.insert(coinTransactions).values({
          shishyaUserId: existing.shishyaUserId,
          amount: finalValue,
          type: 'reward',
          reason: `Approved reward: ${existing.aiReason || 'Rule trigger'}`,
          referenceId: id.toString(),
          referenceType: 'reward_approval',
          balanceAfter: newBalance,
        }).returning();
        
        transactionId = transaction.id;
      }

      await db.update(rewardApprovals)
        .set({
          status: 'approved',
          adjustedValue: adjustedValue !== undefined ? adjustedValue : null,
          reviewedBy: req.user!.userId,
          reviewedAt: new Date(),
          reviewNotes: notes || null,
          walletTransactionId: transactionId,
          updatedAt: new Date(),
        })
        .where(eq(rewardApprovals.id, id));

      await logAdminAction(
        req.user!.userId,
        'REWARD_APPROVED',
        'reward_approval',
        id.toString(),
        { status: 'pending', value: existing.originalValue },
        { status: 'approved', value: finalValue },
        notes,
        req
      );

      res.json({ success: true, message: 'Reward approved successfully' });
    } catch (error) {
      console.error('[Governance] Error approving reward:', error);
      res.status(500).json({ error: 'Failed to approve reward' });
    }
  });

  app.post('/api/governance/approvals/:id/reject', requireAuth, requireAdminOrHigher, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ error: 'Rejection reason is required' });
      }

      const [existing] = await db.select().from(rewardApprovals).where(eq(rewardApprovals.id, id));
      if (!existing) {
        return res.status(404).json({ error: 'Approval not found' });
      }

      if (existing.status !== 'pending') {
        return res.status(400).json({ error: 'This reward has already been processed' });
      }

      await db.update(rewardApprovals)
        .set({
          status: 'rejected',
          reviewedBy: req.user!.userId,
          reviewedAt: new Date(),
          reviewNotes: reason,
          updatedAt: new Date(),
        })
        .where(eq(rewardApprovals.id, id));

      await logAdminAction(
        req.user!.userId,
        'REWARD_REJECTED',
        'reward_approval',
        id.toString(),
        { status: 'pending' },
        { status: 'rejected', reason },
        reason,
        req
      );

      res.json({ success: true, message: 'Reward rejected' });
    } catch (error) {
      console.error('[Governance] Error rejecting reward:', error);
      res.status(500).json({ error: 'Failed to reject reward' });
    }
  });

  app.post('/api/governance/approvals/:id/revoke', requireAuth, requireAdminOrHigher, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ error: 'Revocation reason is required' });
      }

      const [existing] = await db.select().from(rewardApprovals).where(eq(rewardApprovals.id, id));
      if (!existing) {
        return res.status(404).json({ error: 'Approval not found' });
      }

      if (existing.status !== 'approved') {
        return res.status(400).json({ error: 'Only approved rewards can be revoked' });
      }

      const valueToDeduct = existing.adjustedValue || existing.originalValue;

      if (existing.rewardType === 'coins') {
        const [wallet] = await db.select().from(coinWallets).where(eq(coinWallets.shishyaUserId, existing.shishyaUserId));
        
        if (wallet) {
          const newBalance = Math.max(0, wallet.balance - valueToDeduct);
          await db.update(coinWallets)
            .set({ 
              balance: newBalance,
              updatedAt: new Date()
            })
            .where(eq(coinWallets.id, wallet.id));

          await db.insert(coinTransactions).values({
            shishyaUserId: existing.shishyaUserId,
            amount: -valueToDeduct,
            type: 'revocation',
            reason: `Revoked reward: ${reason}`,
            referenceId: id.toString(),
            referenceType: 'reward_revocation',
            balanceAfter: newBalance,
          });
        }
      }

      await db.update(rewardApprovals)
        .set({
          status: 'revoked',
          reviewNotes: `${existing.reviewNotes || ''}\nRevoked: ${reason}`,
          updatedAt: new Date(),
        })
        .where(eq(rewardApprovals.id, id));

      await logAdminAction(
        req.user!.userId,
        'REWARD_REVOKED',
        'reward_approval',
        id.toString(),
        { status: 'approved', value: valueToDeduct },
        { status: 'revoked' },
        reason,
        req
      );

      res.json({ success: true, message: 'Reward revoked and deducted from wallet' });
    } catch (error) {
      console.error('[Governance] Error revoking reward:', error);
      res.status(500).json({ error: 'Failed to revoke reward' });
    }
  });

  // ==================== FRAUD FLAGS ====================

  app.get('/api/governance/fraud-flags', requireAuth, requireAdminOrHigher, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status = 'active' } = req.query;
      
      const flags = await db.select({
        flag: fraudFlags,
        user: shishyaUsers,
      })
      .from(fraudFlags)
      .leftJoin(shishyaUsers, eq(fraudFlags.shishyaUserId, shishyaUsers.id))
      .where(eq(fraudFlags.status, status as string))
      .orderBy(desc(fraudFlags.createdAt));

      const formattedFlags = flags.map(f => ({
        ...f.flag,
        student: f.user ? {
          id: f.user.id,
          name: f.user.name,
          email: f.user.email,
        } : null,
      }));

      res.json(formattedFlags);
    } catch (error) {
      console.error('[Governance] Error fetching fraud flags:', error);
      res.status(500).json({ error: 'Failed to fetch fraud flags' });
    }
  });

  app.post('/api/governance/fraud-flags/:id/resolve', requireAuth, requireAdminOrHigher, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { notes, action } = req.body;

      const [existing] = await db.select().from(fraudFlags).where(eq(fraudFlags.id, id));
      if (!existing) {
        return res.status(404).json({ error: 'Fraud flag not found' });
      }

      await db.update(fraudFlags)
        .set({
          status: 'resolved',
          resolvedBy: req.user!.userId,
          resolvedAt: new Date(),
          resolutionNotes: notes,
        })
        .where(eq(fraudFlags.id, id));

      await logAdminAction(
        req.user!.userId,
        'FRAUD_FLAG_RESOLVED',
        'fraud_flag',
        id.toString(),
        { status: 'active' },
        { status: 'resolved', action },
        notes,
        req
      );

      res.json({ success: true, message: 'Fraud flag resolved' });
    } catch (error) {
      console.error('[Governance] Error resolving fraud flag:', error);
      res.status(500).json({ error: 'Failed to resolve fraud flag' });
    }
  });

  // ==================== WALLET CONTROLS ====================

  app.post('/api/governance/wallets/:userId/freeze', requireAuth, requireAdminOrHigher, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ error: 'Freeze reason is required' });
      }

      const [existingFreeze] = await db.select().from(walletFreezes)
        .where(and(eq(walletFreezes.shishyaUserId, userId), eq(walletFreezes.isActive, true)));

      if (existingFreeze) {
        return res.status(400).json({ error: 'Wallet is already frozen' });
      }

      await db.insert(walletFreezes).values({
        shishyaUserId: userId,
        reason,
        frozenBy: req.user!.userId,
        isActive: true,
      });

      await logAdminAction(
        req.user!.userId,
        'WALLET_FROZEN',
        'wallet',
        userId.toString(),
        { frozen: false },
        { frozen: true, reason },
        reason,
        req
      );

      res.json({ success: true, message: 'Wallet frozen successfully' });
    } catch (error) {
      console.error('[Governance] Error freezing wallet:', error);
      res.status(500).json({ error: 'Failed to freeze wallet' });
    }
  });

  app.post('/api/governance/wallets/:userId/unfreeze', requireAuth, requireAdminOrHigher, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const { reason } = req.body;

      const [existingFreeze] = await db.select().from(walletFreezes)
        .where(and(eq(walletFreezes.shishyaUserId, userId), eq(walletFreezes.isActive, true)));

      if (!existingFreeze) {
        return res.status(400).json({ error: 'Wallet is not frozen' });
      }

      await db.update(walletFreezes)
        .set({
          isActive: false,
          unfrozenBy: req.user!.userId,
          unfrozenAt: new Date(),
          unfreezeReason: reason,
        })
        .where(eq(walletFreezes.id, existingFreeze.id));

      await logAdminAction(
        req.user!.userId,
        'WALLET_UNFROZEN',
        'wallet',
        userId.toString(),
        { frozen: true },
        { frozen: false, reason },
        reason,
        req
      );

      res.json({ success: true, message: 'Wallet unfrozen successfully' });
    } catch (error) {
      console.error('[Governance] Error unfreezing wallet:', error);
      res.status(500).json({ error: 'Failed to unfreeze wallet' });
    }
  });

  // ==================== MANUAL OVERRIDES ====================

  app.post('/api/governance/overrides/grant-coins', requireAuth, requireAdminOrHigher, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, amount, reason } = req.body;

      if (!userId || !amount || !reason) {
        return res.status(400).json({ error: 'User ID, amount, and reason are required' });
      }

      const [frozen] = await db.select().from(walletFreezes)
        .where(and(eq(walletFreezes.shishyaUserId, userId), eq(walletFreezes.isActive, true)));

      if (frozen) {
        return res.status(400).json({ error: 'User wallet is frozen. Cannot grant coins.' });
      }

      let [wallet] = await db.select().from(coinWallets).where(eq(coinWallets.shishyaUserId, userId));
      
      if (!wallet) {
        [wallet] = await db.insert(coinWallets).values({
          shishyaUserId: userId,
          balance: 0,
          lifetimeEarned: 0,
          lifetimeSpent: 0,
        }).returning();
      }

      const newBalance = wallet.balance + amount;
      await db.update(coinWallets)
        .set({ 
          balance: newBalance, 
          lifetimeEarned: wallet.lifetimeEarned + amount,
          updatedAt: new Date()
        })
        .where(eq(coinWallets.id, wallet.id));

      const [transaction] = await db.insert(coinTransactions).values({
        shishyaUserId: userId,
        amount,
        type: 'manual_grant',
        reason: `Admin grant: ${reason}`,
        referenceType: 'admin_override',
        balanceAfter: newBalance,
      }).returning();

      await db.insert(rewardOverrides).values({
        shishyaUserId: userId,
        adminId: req.user!.userId,
        actionType: 'grant_coins',
        rewardType: 'coins',
        amount,
        reason,
        walletTransactionId: transaction.id,
      });

      await logAdminAction(
        req.user!.userId,
        'MANUAL_COIN_GRANT',
        'wallet',
        userId.toString(),
        { balance: wallet.balance },
        { balance: newBalance, granted: amount },
        reason,
        req
      );

      res.json({ success: true, message: `Granted ${amount} coins successfully`, newBalance });
    } catch (error) {
      console.error('[Governance] Error granting coins:', error);
      res.status(500).json({ error: 'Failed to grant coins' });
    }
  });

  app.post('/api/governance/overrides/deduct-coins', requireAuth, requireAdminOrHigher, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, amount, reason } = req.body;

      if (!userId || !amount || !reason) {
        return res.status(400).json({ error: 'User ID, amount, and reason are required' });
      }

      const [wallet] = await db.select().from(coinWallets).where(eq(coinWallets.shishyaUserId, userId));
      
      if (!wallet) {
        return res.status(404).json({ error: 'User wallet not found' });
      }

      const newBalance = Math.max(0, wallet.balance - amount);
      const actualDeduction = wallet.balance - newBalance;

      await db.update(coinWallets)
        .set({ 
          balance: newBalance,
          updatedAt: new Date()
        })
        .where(eq(coinWallets.id, wallet.id));

      const [transaction] = await db.insert(coinTransactions).values({
        shishyaUserId: userId,
        amount: -actualDeduction,
        type: 'manual_deduction',
        reason: `Admin deduction: ${reason}`,
        referenceType: 'admin_override',
        balanceAfter: newBalance,
      }).returning();

      await db.insert(rewardOverrides).values({
        shishyaUserId: userId,
        adminId: req.user!.userId,
        actionType: 'deduct_coins',
        rewardType: 'coins',
        amount: -actualDeduction,
        reason,
        walletTransactionId: transaction.id,
      });

      await logAdminAction(
        req.user!.userId,
        'MANUAL_COIN_DEDUCTION',
        'wallet',
        userId.toString(),
        { balance: wallet.balance },
        { balance: newBalance, deducted: actualDeduction },
        reason,
        req
      );

      res.json({ success: true, message: `Deducted ${actualDeduction} coins`, newBalance });
    } catch (error) {
      console.error('[Governance] Error deducting coins:', error);
      res.status(500).json({ error: 'Failed to deduct coins' });
    }
  });

  // ==================== MOTIVATION RULES ====================

  app.get('/api/governance/motivation-rules', requireAuth, requireAdminOrHigher, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const rules = await db.select().from(motivationRules).orderBy(desc(motivationRules.priority));
      res.json(rules);
    } catch (error) {
      console.error('[Governance] Error fetching motivation rules:', error);
      res.status(500).json({ error: 'Failed to fetch motivation rules' });
    }
  });

  app.post('/api/governance/motivation-rules', requireAuth, requireAdminOrHigher, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, description, triggerType, triggerCondition, rewardType, rewardValue, approvalMode, priority, isActive } = req.body;

      if (!name || !triggerType || !rewardType) {
        return res.status(400).json({ error: 'Name, trigger type, and reward type are required' });
      }

      const [rule] = await db.insert(motivationRules).values({
        name,
        description,
        triggerType,
        triggerCondition,
        rewardType,
        rewardValue: rewardValue || 0,
        approvalMode: approvalMode || 'admin_approval_required',
        priority: priority || 0,
        isActive: isActive !== false,
      }).returning();

      await logAdminAction(
        req.user!.userId,
        'MOTIVATION_RULE_CREATED',
        'motivation_rule',
        rule.id.toString(),
        null,
        rule,
        `Created rule: ${name}`,
        req
      );

      res.json(rule);
    } catch (error) {
      console.error('[Governance] Error creating motivation rule:', error);
      res.status(500).json({ error: 'Failed to create motivation rule' });
    }
  });

  app.patch('/api/governance/motivation-rules/:id', requireAuth, requireAdminOrHigher, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      const [existing] = await db.select().from(motivationRules).where(eq(motivationRules.id, id));
      if (!existing) {
        return res.status(404).json({ error: 'Motivation rule not found' });
      }

      const [updated] = await db.update(motivationRules)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(motivationRules.id, id))
        .returning();

      await logAdminAction(
        req.user!.userId,
        'MOTIVATION_RULE_UPDATED',
        'motivation_rule',
        id.toString(),
        existing,
        updated,
        `Updated rule: ${existing.name}`,
        req
      );

      res.json(updated);
    } catch (error) {
      console.error('[Governance] Error updating motivation rule:', error);
      res.status(500).json({ error: 'Failed to update motivation rule' });
    }
  });

  // ==================== APPROVAL POLICIES ====================

  app.get('/api/governance/policies', requireAuth, requireAdminOrHigher, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const policies = await db.select().from(approvalPolicies).where(eq(approvalPolicies.isActive, true));
      res.json(policies);
    } catch (error) {
      console.error('[Governance] Error fetching policies:', error);
      res.status(500).json({ error: 'Failed to fetch approval policies' });
    }
  });

  app.post('/api/governance/policies', requireAuth, requireAdminOrHigher, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const [policy] = await db.insert(approvalPolicies).values(req.body).returning();
      
      await logAdminAction(
        req.user!.userId,
        'POLICY_CREATED',
        'approval_policy',
        policy.id.toString(),
        null,
        policy,
        `Created policy for ${policy.rewardType}`,
        req
      );

      res.json(policy);
    } catch (error) {
      console.error('[Governance] Error creating policy:', error);
      res.status(500).json({ error: 'Failed to create approval policy' });
    }
  });

  // ==================== AUDIT LOGS ====================

  app.get('/api/governance/audit-logs', requireAuth, requireAdminOrHigher, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { entityType, actionType, adminId, limit = '100', offset = '0' } = req.query;
      
      let query = db.select({
        log: adminActionLogs,
        admin: users,
      })
      .from(adminActionLogs)
      .leftJoin(users, eq(adminActionLogs.adminId, users.id))
      .orderBy(desc(adminActionLogs.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

      const results = await query;
      
      let filtered = results;
      if (entityType) {
        filtered = filtered.filter(r => r.log.entityType === entityType);
      }
      if (actionType) {
        filtered = filtered.filter(r => r.log.actionType === actionType);
      }
      if (adminId) {
        filtered = filtered.filter(r => r.log.adminId === adminId);
      }

      const formattedResults = filtered.map(r => ({
        ...r.log,
        adminName: r.admin?.username || 'Unknown',
      }));

      res.json(formattedResults);
    } catch (error) {
      console.error('[Governance] Error fetching audit logs:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  });

  app.get('/api/governance/audit-logs/export', requireAuth, requireAdminOrHigher, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      let conditions = [];
      if (startDate) {
        conditions.push(gte(adminActionLogs.createdAt, new Date(startDate as string)));
      }
      if (endDate) {
        conditions.push(lte(adminActionLogs.createdAt, new Date(endDate as string)));
      }

      const logs = await db.select({
        log: adminActionLogs,
        admin: users,
      })
      .from(adminActionLogs)
      .leftJoin(users, eq(adminActionLogs.adminId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(adminActionLogs.createdAt));

      const csv = [
        'ID,Admin,Action Type,Entity Type,Entity ID,Reason,IP Address,Created At',
        ...logs.map(l => 
          `${l.log.id},"${l.admin?.username || 'Unknown'}","${l.log.actionType}","${l.log.entityType}","${l.log.entityId || ''}","${l.log.reason || ''}","${l.log.ipAddress || ''}","${l.log.createdAt}"`
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
      res.send(csv);
    } catch (error) {
      console.error('[Governance] Error exporting audit logs:', error);
      res.status(500).json({ error: 'Failed to export audit logs' });
    }
  });

  // ==================== RISK SCORES ====================

  app.get('/api/governance/risk-scores', requireAuth, requireAdminOrHigher, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const scores = await db.select({
        score: riskScores,
        user: shishyaUsers,
      })
      .from(riskScores)
      .leftJoin(shishyaUsers, eq(riskScores.shishyaUserId, shishyaUsers.id))
      .orderBy(desc(riskScores.overallScore));

      const formattedScores = scores.map(s => ({
        ...s.score,
        student: s.user ? {
          id: s.user.id,
          name: s.user.name,
          email: s.user.email,
        } : null,
      }));

      res.json(formattedScores);
    } catch (error) {
      console.error('[Governance] Error fetching risk scores:', error);
      res.status(500).json({ error: 'Failed to fetch risk scores' });
    }
  });

  // ==================== SCHOLARSHIPS ====================

  app.get('/api/governance/scholarships', requireAuth, requireAdminOrHigher, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status } = req.query;
      
      let query = db.select({
        scholarship: scholarships,
        user: shishyaUsers,
      })
      .from(scholarships)
      .leftJoin(shishyaUsers, eq(scholarships.shishyaUserId, shishyaUsers.id))
      .orderBy(desc(scholarships.createdAt));

      const results = await query;
      
      let filtered = results;
      if (status) {
        filtered = filtered.filter(s => s.scholarship.status === status);
      }

      const formattedResults = filtered.map(s => ({
        ...s.scholarship,
        student: s.user ? {
          id: s.user.id,
          name: s.user.name,
          email: s.user.email,
        } : null,
      }));

      res.json(formattedResults);
    } catch (error) {
      console.error('[Governance] Error fetching scholarships:', error);
      res.status(500).json({ error: 'Failed to fetch scholarships' });
    }
  });

  app.post('/api/governance/scholarships', requireAuth, requireAdminOrHigher, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, title, description, amount, courseId, validFrom, validTo } = req.body;

      if (!userId || !title || !amount) {
        return res.status(400).json({ error: 'User ID, title, and amount are required' });
      }

      const [scholarship] = await db.insert(scholarships).values({
        shishyaUserId: userId,
        title,
        description,
        amount,
        courseId,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
        issuedBy: req.user!.userId,
        issuedAt: new Date(),
        status: 'approved',
      }).returning();

      await logAdminAction(
        req.user!.userId,
        'SCHOLARSHIP_GRANTED',
        'scholarship',
        scholarship.id.toString(),
        null,
        scholarship,
        `Granted scholarship: ${title}`,
        req
      );

      res.json(scholarship);
    } catch (error) {
      console.error('[Governance] Error creating scholarship:', error);
      res.status(500).json({ error: 'Failed to create scholarship' });
    }
  });

  // ==================== SHISHYA USERS LIST ====================

  app.get('/api/governance/students', requireAuth, requireAdminOrHigher, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { search, limit = '50', offset = '0' } = req.query;
      
      const students = await db.select({
        user: shishyaUsers,
        wallet: coinWallets,
        riskScore: riskScores,
      })
      .from(shishyaUsers)
      .leftJoin(coinWallets, eq(shishyaUsers.id, coinWallets.shishyaUserId))
      .leftJoin(riskScores, eq(shishyaUsers.id, riskScores.shishyaUserId))
      .orderBy(desc(shishyaUsers.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

      const [frozenWallets] = await db.select({ 
        userIds: sql<number[]>`array_agg(${walletFreezes.shishyaUserId})`
      }).from(walletFreezes).where(eq(walletFreezes.isActive, true));

      const frozenSet = new Set(frozenWallets?.userIds || []);

      const formattedStudents = students.map(s => ({
        id: s.user.id,
        name: s.user.name,
        email: s.user.email,
        phone: s.user.phone,
        status: s.user.status,
        lastActiveAt: s.user.lastActiveAt,
        createdAt: s.user.createdAt,
        wallet: s.wallet ? {
          balance: s.wallet.balance,
          lifetimeEarned: s.wallet.lifetimeEarned,
          lifetimeSpent: s.wallet.lifetimeSpent,
        } : null,
        riskScore: s.riskScore?.overallScore || 0,
        isWalletFrozen: frozenSet.has(s.user.id),
      }));

      let filtered = formattedStudents;
      if (search) {
        const searchLower = (search as string).toLowerCase();
        filtered = filtered.filter(s => 
          s.name.toLowerCase().includes(searchLower) || 
          s.email.toLowerCase().includes(searchLower)
        );
      }

      res.json(filtered);
    } catch (error) {
      console.error('[Governance] Error fetching students:', error);
      res.status(500).json({ error: 'Failed to fetch students' });
    }
  });
}
