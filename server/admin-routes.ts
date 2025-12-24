import type { Express, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { storage } from './storage';
import { verifyToken } from './auth-middleware';
import { generateOTP, sendOTPEmail } from './email-service';

const BCRYPT_ROUNDS = 12;

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

function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
}

function requireAdminOrHigher(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!['admin', 'super_admin'].includes(req.user?.role || '')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

const inviteAdminSchema = z.object({
  email: z.string().email('Valid email required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['reviewer', 'admin', 'super_admin']).default('admin'),
});

const updateAdminRoleSchema = z.object({
  role: z.enum(['reviewer', 'admin', 'super_admin']),
});

const updateAdminStatusSchema = z.object({
  isActive: z.boolean(),
});

export function registerAdminRoutes(app: Express) {
  app.get('/api/admin/admins', requireAuth, requireAdminOrHigher, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const admins = await storage.getAllAdmins();
      
      const sanitizedAdmins = admins.map(admin => ({
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        twoFactorEnabled: admin.twoFactorEnabled,
        failedLoginAttempts: admin.failedLoginAttempts,
        lockedUntil: admin.lockedUntil,
        lastLoginAt: admin.lastLoginAt,
        createdAt: admin.createdAt,
        invitedBy: admin.invitedBy,
      }));

      res.json(sanitizedAdmins);
    } catch (error) {
      console.error('[Admin] Error fetching admins:', error);
      res.status(500).json({ error: 'Failed to fetch admins' });
    }
  });

  app.post('/api/admin/invite', requireAuth, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validation = inviteAdminSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: validation.error.errors 
        });
      }

      const { email, name, role } = validation.data;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
      const hashedPassword = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

      const newUser = await storage.createUser({
        username: name,
        email,
        password: hashedPassword,
        role: 'pending',
      });

      await storage.updateUserInvitedBy(newUser.id, req.user!.userId);

      const otp = generateOTP();
      await sendOTPEmail(
        email,
        otp,
        `You've been invited as ${role} to OurShiksha Guru Admin Portal. Use this code to complete your registration.`
      );

      await storage.createAuditLog({
        userId: req.user!.userId,
        action: 'ADMIN_INVITE',
        entityType: 'ADMIN',
        entityId: null,
        metadata: { invitedEmail: email, role, invitedBy: req.user!.username }
      });

      res.json({ 
        success: true, 
        message: 'Invitation sent successfully',
        admin: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: 'pending',
        }
      });
    } catch (error) {
      console.error('[Admin] Error inviting admin:', error);
      res.status(500).json({ error: 'Failed to send invitation' });
    }
  });

  app.patch('/api/admin/admins/:id/role', requireAuth, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const validation = updateAdminRoleSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: validation.error.errors 
        });
      }

      const { role } = validation.data;
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      if (id === req.user!.userId) {
        return res.status(400).json({ error: 'Cannot change your own role' });
      }

      const oldRole = user.role;
      await storage.updateUserRole(id, role);

      await storage.createAuditLog({
        userId: req.user!.userId,
        action: 'ADMIN_ROLE_UPDATE',
        entityType: 'ADMIN',
        entityId: null,
        oldValue: { role: oldRole },
        newValue: { role },
        metadata: { targetUser: user.email, updatedBy: req.user!.username }
      });

      res.json({ success: true, message: 'Role updated successfully' });
    } catch (error) {
      console.error('[Admin] Error updating role:', error);
      res.status(500).json({ error: 'Failed to update role' });
    }
  });

  app.patch('/api/admin/admins/:id/status', requireAuth, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const validation = updateAdminStatusSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: validation.error.errors 
        });
      }

      const { isActive } = validation.data;
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      if (id === req.user!.userId) {
        return res.status(400).json({ error: 'Cannot change your own status' });
      }

      await storage.updateUserStatus(id, isActive);

      if (!isActive) {
        await storage.revokeUserSessions(id);
      }

      await storage.createAuditLog({
        userId: req.user!.userId,
        action: isActive ? 'ADMIN_ACTIVATE' : 'ADMIN_DEACTIVATE',
        entityType: 'ADMIN',
        entityId: null,
        metadata: { targetUser: user.email, updatedBy: req.user!.username }
      });

      res.json({ success: true, message: `Admin ${isActive ? 'activated' : 'deactivated'} successfully` });
    } catch (error) {
      console.error('[Admin] Error updating status:', error);
      res.status(500).json({ error: 'Failed to update status' });
    }
  });

  app.delete('/api/admin/admins/:id', requireAuth, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      if (id === req.user!.userId) {
        return res.status(400).json({ error: 'Cannot delete yourself' });
      }

      if (user.role === 'super_admin') {
        return res.status(400).json({ error: 'Cannot delete super admin' });
      }

      await storage.deleteUser(id);

      await storage.createAuditLog({
        userId: req.user!.userId,
        action: 'ADMIN_DELETE',
        entityType: 'ADMIN',
        entityId: null,
        metadata: { deletedUser: user.email, deletedBy: req.user!.username }
      });

      res.json({ success: true, message: 'Admin removed successfully' });
    } catch (error) {
      console.error('[Admin] Error deleting admin:', error);
      res.status(500).json({ error: 'Failed to delete admin' });
    }
  });

  app.post('/api/admin/admins/:id/force-logout', requireAuth, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      await storage.revokeUserSessions(id);

      await storage.createAuditLog({
        userId: req.user!.userId,
        action: 'ADMIN_FORCE_LOGOUT',
        entityType: 'ADMIN',
        entityId: null,
        metadata: { targetUser: user.email, revokedBy: req.user!.username }
      });

      res.json({ success: true, message: 'All sessions revoked' });
    } catch (error) {
      console.error('[Admin] Error force logout:', error);
      res.status(500).json({ error: 'Failed to revoke sessions' });
    }
  });

  app.post('/api/admin/admins/:id/unlock', requireAuth, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      await storage.unlockUser(id);

      await storage.createAuditLog({
        userId: req.user!.userId,
        action: 'ADMIN_UNLOCK',
        entityType: 'ADMIN',
        entityId: null,
        metadata: { targetUser: user.email, unlockedBy: req.user!.username }
      });

      res.json({ success: true, message: 'Account unlocked' });
    } catch (error) {
      console.error('[Admin] Error unlocking user:', error);
      res.status(500).json({ error: 'Failed to unlock account' });
    }
  });

  app.get('/api/admin/audit-logs', requireAuth, requireAdminOrHigher, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { entityType, limit = '100', offset = '0' } = req.query;
      
      const logs = await storage.getAllAuditLogs({
        entityType: entityType as string | undefined,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      });

      const enrichedLogs = await Promise.all(
        logs.map(async (log) => {
          let username = 'System';
          if (log.userId) {
            const user = await storage.getUser(log.userId);
            username = user?.username || 'Unknown';
          }
          return {
            ...log,
            username,
          };
        })
      );

      res.json(enrichedLogs);
    } catch (error) {
      console.error('[Admin] Error fetching audit logs:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  });

  app.get('/api/admin/login-logs', requireAuth, requireAdminOrHigher, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { success, limit = '100' } = req.query;
      
      const logs = await storage.getLoginAttempts({
        success: success === undefined ? undefined : success === 'true',
        limit: parseInt(limit as string, 10),
      });

      const enrichedLogs = await Promise.all(
        logs.map(async (log) => {
          let username;
          if (log.userId) {
            const user = await storage.getUser(log.userId);
            username = user?.username;
          }
          return {
            ...log,
            username,
          };
        })
      );

      res.json(enrichedLogs);
    } catch (error) {
      console.error('[Admin] Error fetching login logs:', error);
      res.status(500).json({ error: 'Failed to fetch login logs' });
    }
  });

  app.get('/api/admin/sessions', requireAuth, requireAdminOrHigher, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const sessions = await storage.getAllActiveSessions();
      
      const enrichedSessions = await Promise.all(
        sessions.map(async (session) => {
          const user = await storage.getUser(session.userId);
          return {
            ...session,
            username: user?.username || 'Unknown',
            isCurrent: session.userId === req.user!.userId,
          };
        })
      );

      res.json(enrichedSessions);
    } catch (error) {
      console.error('[Admin] Error fetching sessions:', error);
      res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  });

  app.post('/api/admin/sessions/revoke', requireAuth, requireAdminOrHigher, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId, userId, revokeAll } = req.body;

      if (revokeAll) {
        await storage.revokeAllSessionsExcept(req.user!.userId);
        
        await storage.createAuditLog({
          userId: req.user!.userId,
          action: 'SESSIONS_REVOKE_ALL',
          entityType: 'SESSION',
          entityId: null,
          metadata: { revokedBy: req.user!.username }
        });

        return res.json({ success: true, message: 'All other sessions revoked' });
      }

      if (sessionId) {
        await storage.revokeSession(sessionId);
        return res.json({ success: true, message: 'Session revoked' });
      }

      if (userId) {
        await storage.revokeUserSessions(userId);
        return res.json({ success: true, message: 'User sessions revoked' });
      }

      res.status(400).json({ error: 'No session or user specified' });
    } catch (error) {
      console.error('[Admin] Error revoking sessions:', error);
      res.status(500).json({ error: 'Failed to revoke sessions' });
    }
  });

  app.get('/api/admin/users', requireAuth, requireAdminOrHigher, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const admins = await storage.getAllAdmins();
      
      const sanitizedAdmins = admins.map(admin => ({
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        twoFactorEnabled: admin.twoFactorEnabled,
        failedLoginAttempts: admin.failedLoginAttempts,
        lockedUntil: admin.lockedUntil,
        lastLoginAt: admin.lastLoginAt,
        createdAt: admin.createdAt,
        invitedBy: admin.invitedBy,
      }));

      res.json(sanitizedAdmins);
    } catch (error) {
      console.error('[Admin] Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });
}
