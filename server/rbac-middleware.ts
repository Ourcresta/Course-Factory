import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { 
  adminUserRoles, 
  adminRolePermissions, 
  adminPermissions, 
  adminRoles,
  dataAccessLogs
} from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";

interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    userId?: string;
    username?: string;
    email?: string;
    role?: string;
    permissions?: string[];
  };
}

const permissionCache = new Map<string, { permissions: string[]; cachedAt: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export async function getUserPermissions(userId: string): Promise<string[]> {
  const cached = permissionCache.get(userId);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
    return cached.permissions;
  }

  const userRoles = await db
    .select({ roleId: adminUserRoles.roleId })
    .from(adminUserRoles)
    .where(and(
      eq(adminUserRoles.userId, userId),
      eq(adminUserRoles.isActive, true)
    ));

  if (userRoles.length === 0) {
    const defaultPerms = ["dashboard.view"];
    permissionCache.set(userId, { permissions: defaultPerms, cachedAt: Date.now() });
    return defaultPerms;
  }

  const roleIds = userRoles.map(r => r.roleId);

  const rolePermissions = await db
    .select({ code: adminPermissions.code })
    .from(adminRolePermissions)
    .innerJoin(adminPermissions, eq(adminRolePermissions.permissionId, adminPermissions.id))
    .where(inArray(adminRolePermissions.roleId, roleIds));

  const permissions = Array.from(new Set(rolePermissions.map(p => p.code)));

  permissionCache.set(userId, { permissions, cachedAt: Date.now() });
  return permissions;
}

export async function getUserRoles(userId: string): Promise<string[]> {
  const userRoles = await db
    .select({ name: adminRoles.name })
    .from(adminUserRoles)
    .innerJoin(adminRoles, eq(adminUserRoles.roleId, adminRoles.id))
    .where(and(
      eq(adminUserRoles.userId, userId),
      eq(adminUserRoles.isActive, true)
    ));

  return userRoles.map(r => r.name);
}

export function clearPermissionCache(userId?: string) {
  if (userId) {
    permissionCache.delete(userId);
  } else {
    permissionCache.clear();
  }
}

export function requirePermission(...requiredPermissions: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id || req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const userRoles = await getUserRoles(userId);
      
      if (userRoles.includes("super_admin")) {
        return next();
      }

      const userPermissions = await getUserPermissions(userId);
      
      const hasPermission = requiredPermissions.some(required => {
        if (userPermissions.includes(required)) return true;
        
        const category = required.split(".")[0];
        if (userPermissions.includes(`${category}.*`)) return true;
        
        return false;
      });

      if (!hasPermission) {
        return res.status(403).json({ 
          error: "Access denied",
          message: `Missing required permission: ${requiredPermissions.join(" or ")}`
        });
      }

      req.user!.permissions = userPermissions;
      next();
    } catch (error) {
      console.error("[RBAC] Error checking permissions:", error);
      return res.status(500).json({ error: "Failed to verify permissions" });
    }
  };
}

export function requireRole(...allowedRoles: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id || req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const userRoles = await getUserRoles(userId);
      
      if (userRoles.includes("super_admin")) {
        return next();
      }

      const hasRole = userRoles.some(role => allowedRoles.includes(role));

      if (!hasRole) {
        return res.status(403).json({ 
          error: "Access denied",
          message: `Required role: ${allowedRoles.join(" or ")}`
        });
      }

      next();
    } catch (error) {
      console.error("[RBAC] Error checking roles:", error);
      return res.status(500).json({ error: "Failed to verify role" });
    }
  };
}

export function requireMinLevel(minLevel: number) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id || req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const userRoles = await db
        .select({ level: adminRoles.level })
        .from(adminUserRoles)
        .innerJoin(adminRoles, eq(adminUserRoles.roleId, adminRoles.id))
        .where(and(
          eq(adminUserRoles.userId, userId),
          eq(adminUserRoles.isActive, true)
        ));

      const maxLevel = Math.max(...userRoles.map(r => r.level), 0);

      if (maxLevel < minLevel) {
        return res.status(403).json({ 
          error: "Access denied",
          message: "Insufficient access level"
        });
      }

      next();
    } catch (error) {
      console.error("[RBAC] Error checking level:", error);
      return res.status(500).json({ error: "Failed to verify access level" });
    }
  };
}

export async function logDataAccess(
  userId: string | undefined,
  entityType: string,
  entityId: string | undefined,
  accessType: string,
  fieldsAccessed?: string[],
  req?: Request
) {
  try {
    await db.insert(dataAccessLogs).values({
      userId: userId || null,
      entityType,
      entityId: entityId || null,
      accessType,
      fieldsAccessed: fieldsAccessed || null,
      ipAddress: req?.ip || null,
      userAgent: req?.get("user-agent") || null,
      sessionId: null,
    });
  } catch (error) {
    console.error("[RBAC] Failed to log data access:", error);
  }
}

export async function assignRoleToUser(
  userId: string,
  roleName: string,
  assignedBy?: string
): Promise<boolean> {
  try {
    const role = await db
      .select({ id: adminRoles.id })
      .from(adminRoles)
      .where(eq(adminRoles.name, roleName))
      .limit(1);

    if (role.length === 0) {
      console.error(`[RBAC] Role not found: ${roleName}`);
      return false;
    }

    await db.insert(adminUserRoles).values({
      userId,
      roleId: role[0].id,
      assignedBy: assignedBy || null,
      isActive: true,
    }).onConflictDoNothing();

    clearPermissionCache(userId);
    return true;
  } catch (error) {
    console.error("[RBAC] Failed to assign role:", error);
    return false;
  }
}

export async function removeRoleFromUser(
  userId: string,
  roleName: string
): Promise<boolean> {
  try {
    const role = await db
      .select({ id: adminRoles.id })
      .from(adminRoles)
      .where(eq(adminRoles.name, roleName))
      .limit(1);

    if (role.length === 0) {
      return false;
    }

    await db
      .update(adminUserRoles)
      .set({ isActive: false })
      .where(and(
        eq(adminUserRoles.userId, userId),
        eq(adminUserRoles.roleId, role[0].id)
      ));

    clearPermissionCache(userId);
    return true;
  } catch (error) {
    console.error("[RBAC] Failed to remove role:", error);
    return false;
  }
}

export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  const userRoles = await getUserRoles(userId);
  if (userRoles.includes("super_admin")) return true;

  const permissions = await getUserPermissions(userId);
  if (permissions.includes(permission)) return true;

  const category = permission.split(".")[0];
  return permissions.includes(`${category}.*`);
}

export async function hasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
  for (const perm of permissions) {
    if (await hasPermission(userId, perm)) return true;
  }
  return false;
}

export async function hasAllPermissions(userId: string, permissions: string[]): Promise<boolean> {
  for (const perm of permissions) {
    if (!(await hasPermission(userId, perm))) return false;
  }
  return true;
}
