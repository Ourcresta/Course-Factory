import { db } from "../db";
import { 
  adminRoles, 
  adminPermissions, 
  adminRolePermissions,
  platformSettings,
  creditPolicies,
  approvalTemplates,
  aiModelRegistry
} from "@shared/schema";

export async function seedEnterpriseData() {
  console.log("Seeding enterprise data...");

  // ==================== SEED ADMIN ROLES ====================
  const roles = [
    {
      name: "super_admin",
      displayName: "Super Administrator",
      description: "Full system access with all permissions. Can manage other admins.",
      level: 100,
      isSystem: true,
      isActive: true,
    },
    {
      name: "admin",
      displayName: "Administrator",
      description: "General admin access for day-to-day operations.",
      level: 80,
      isSystem: true,
      isActive: true,
    },
    {
      name: "content_admin",
      displayName: "Content Administrator",
      description: "Manages courses, modules, lessons, and educational content.",
      level: 60,
      isSystem: true,
      isActive: true,
    },
    {
      name: "finance_admin",
      displayName: "Finance Administrator",
      description: "Manages pricing, credits, payments, and financial reports.",
      level: 60,
      isSystem: true,
      isActive: true,
    },
    {
      name: "support_admin",
      displayName: "Support Administrator",
      description: "Handles student support, reward approvals, and user issues.",
      level: 40,
      isSystem: true,
      isActive: true,
    },
    {
      name: "readonly_admin",
      displayName: "Read-Only Administrator",
      description: "View-only access to dashboards and reports.",
      level: 10,
      isSystem: true,
      isActive: true,
    },
  ];

  const insertedRoles = await db.insert(adminRoles).values(roles).onConflictDoNothing().returning();
  console.log(`Inserted ${insertedRoles.length} admin roles`);

  // ==================== SEED ADMIN PERMISSIONS ====================
  const permissions = [
    // Dashboard
    { code: "dashboard.view", name: "View Dashboard", category: "dashboard", isSystem: true },
    { code: "dashboard.analytics", name: "View Analytics", category: "dashboard", isSystem: true },

    // Courses
    { code: "courses.view", name: "View Courses", category: "courses", isSystem: true },
    { code: "courses.create", name: "Create Courses", category: "courses", isSystem: true },
    { code: "courses.edit", name: "Edit Courses", category: "courses", isSystem: true },
    { code: "courses.delete", name: "Delete Courses", category: "courses", isSystem: true },
    { code: "courses.publish", name: "Publish Courses", category: "courses", isSystem: true },
    { code: "courses.unpublish", name: "Unpublish Courses", category: "courses", isSystem: true },
    { code: "courses.ai_generate", name: "Use AI Course Factory", category: "courses", isSystem: true },

    // Users/Admins
    { code: "users.view", name: "View Users", category: "users", isSystem: true },
    { code: "users.create", name: "Create Users", category: "users", isSystem: true },
    { code: "users.edit", name: "Edit Users", category: "users", isSystem: true },
    { code: "users.delete", name: "Delete Users", category: "users", isSystem: true },
    { code: "users.roles", name: "Manage User Roles", category: "users", isSystem: true },

    // Students (Shishya)
    { code: "students.view", name: "View Students", category: "students", isSystem: true },
    { code: "students.manage", name: "Manage Students", category: "students", isSystem: true },
    { code: "students.wallet", name: "Manage Student Wallets", category: "students", isSystem: true },

    // Rewards
    { code: "rewards.view", name: "View Rewards", category: "rewards", isSystem: true },
    { code: "rewards.approve", name: "Approve Rewards", category: "rewards", isSystem: true },
    { code: "rewards.configure", name: "Configure Reward Rules", category: "rewards", isSystem: true },
    { code: "rewards.override", name: "Override Rewards", category: "rewards", isSystem: true },

    // Finance
    { code: "finance.view", name: "View Financial Data", category: "finance", isSystem: true },
    { code: "finance.pricing", name: "Manage Pricing", category: "finance", isSystem: true },
    { code: "finance.credits", name: "Manage Credits", category: "finance", isSystem: true },
    { code: "finance.refunds", name: "Process Refunds", category: "finance", isSystem: true },

    // Settings
    { code: "settings.view", name: "View Settings", category: "settings", isSystem: true },
    { code: "settings.edit", name: "Edit Settings", category: "settings", isSystem: true },
    { code: "settings.api_keys", name: "Manage API Keys", category: "settings", isSystem: true },

    // AI Governance
    { code: "ai.view", name: "View AI Configurations", category: "ai", isSystem: true },
    { code: "ai.configure", name: "Configure AI Rules", category: "ai", isSystem: true },
    { code: "ai.approve", name: "Approve AI Rules", category: "ai", isSystem: true },

    // Certificates
    { code: "certificates.view", name: "View Certificates", category: "certificates", isSystem: true },
    { code: "certificates.manage", name: "Manage Certificates", category: "certificates", isSystem: true },
    { code: "certificates.revoke", name: "Revoke Certificates", category: "certificates", isSystem: true },

    // Reports
    { code: "reports.view", name: "View Reports", category: "reports", isSystem: true },
    { code: "reports.export", name: "Export Reports", category: "reports", isSystem: true },

    // Audit
    { code: "audit.view", name: "View Audit Logs", category: "audit", isSystem: true },
    { code: "audit.export", name: "Export Audit Logs", category: "audit", isSystem: true },

    // Approvals
    { code: "approvals.view", name: "View Approvals", category: "approvals", isSystem: true },
    { code: "approvals.approve", name: "Approve Requests", category: "approvals", isSystem: true },
    { code: "approvals.configure", name: "Configure Approval Workflows", category: "approvals", isSystem: true },
  ];

  const insertedPermissions = await db.insert(adminPermissions).values(permissions).onConflictDoNothing().returning();
  console.log(`Inserted ${insertedPermissions.length} admin permissions`);

  // Get all roles and permissions for mapping
  const allRoles = await db.select().from(adminRoles);
  const allPermissions = await db.select().from(adminPermissions);

  const roleMap = new Map(allRoles.map(r => [r.name, r.id]));
  const permissionMap = new Map(allPermissions.map(p => [p.code, p.id]));

  // ==================== ASSIGN PERMISSIONS TO ROLES ====================
  const rolePermissionMappings: { roleId: number; permissionId: number }[] = [];

  // Super Admin gets ALL permissions
  const superAdminId = roleMap.get("super_admin");
  if (superAdminId) {
    allPermissions.forEach(p => {
      rolePermissionMappings.push({ roleId: superAdminId, permissionId: p.id });
    });
  }

  // Admin gets most permissions except sensitive ones
  const adminId = roleMap.get("admin");
  const adminExcluded = ["users.delete", "settings.api_keys", "ai.configure", "ai.approve"];
  if (adminId) {
    allPermissions.filter(p => !adminExcluded.includes(p.code)).forEach(p => {
      rolePermissionMappings.push({ roleId: adminId, permissionId: p.id });
    });
  }

  // Content Admin - content-focused permissions
  const contentAdminId = roleMap.get("content_admin");
  const contentAdminPerms = [
    "dashboard.view", "dashboard.analytics",
    "courses.view", "courses.create", "courses.edit", "courses.delete", "courses.ai_generate",
    "certificates.view", "certificates.manage",
    "reports.view"
  ];
  if (contentAdminId) {
    contentAdminPerms.forEach(code => {
      const permId = permissionMap.get(code);
      if (permId) rolePermissionMappings.push({ roleId: contentAdminId, permissionId: permId });
    });
  }

  // Finance Admin - finance-focused permissions
  const financeAdminId = roleMap.get("finance_admin");
  const financeAdminPerms = [
    "dashboard.view", "dashboard.analytics",
    "finance.view", "finance.pricing", "finance.credits", "finance.refunds",
    "students.view", "students.wallet",
    "reports.view", "reports.export"
  ];
  if (financeAdminId) {
    financeAdminPerms.forEach(code => {
      const permId = permissionMap.get(code);
      if (permId) rolePermissionMappings.push({ roleId: financeAdminId, permissionId: permId });
    });
  }

  // Support Admin - support-focused permissions
  const supportAdminId = roleMap.get("support_admin");
  const supportAdminPerms = [
    "dashboard.view",
    "students.view", "students.manage",
    "rewards.view", "rewards.approve",
    "approvals.view", "approvals.approve"
  ];
  if (supportAdminId) {
    supportAdminPerms.forEach(code => {
      const permId = permissionMap.get(code);
      if (permId) rolePermissionMappings.push({ roleId: supportAdminId, permissionId: permId });
    });
  }

  // Read-Only Admin - view-only permissions
  const readonlyAdminId = roleMap.get("readonly_admin");
  const readonlyPerms = [
    "dashboard.view", "dashboard.analytics",
    "courses.view", "students.view", "rewards.view", "finance.view",
    "reports.view", "audit.view", "approvals.view"
  ];
  if (readonlyAdminId) {
    readonlyPerms.forEach(code => {
      const permId = permissionMap.get(code);
      if (permId) rolePermissionMappings.push({ roleId: readonlyAdminId, permissionId: permId });
    });
  }

  if (rolePermissionMappings.length > 0) {
    await db.insert(adminRolePermissions).values(rolePermissionMappings).onConflictDoNothing();
    console.log(`Assigned ${rolePermissionMappings.length} role-permission mappings`);
  }

  // ==================== SEED PLATFORM SETTINGS ====================
  const settings = [
    { key: "platform_name", value: "OurShiksha", valueType: "string", category: "general", description: "Platform display name", isPublic: true, isEditable: true },
    { key: "platform_tagline", value: "Learn. Practice. Achieve.", valueType: "string", category: "general", description: "Platform tagline", isPublic: true, isEditable: true },
    { key: "support_email", value: "support@ourshiksha.com", valueType: "string", category: "contact", description: "Support email address", isPublic: true, isEditable: true },
    { key: "max_login_attempts", value: "5", valueType: "number", category: "security", description: "Maximum failed login attempts before lockout", isPublic: false, isEditable: true },
    { key: "lockout_duration_minutes", value: "30", valueType: "number", category: "security", description: "Account lockout duration in minutes", isPublic: false, isEditable: true },
    { key: "session_timeout_hours", value: "12", valueType: "number", category: "security", description: "Admin session timeout in hours", isPublic: false, isEditable: true },
    { key: "require_2fa", value: "false", valueType: "boolean", category: "security", description: "Require 2FA for admin login", isPublic: false, isEditable: true },
    { key: "ai_enabled", value: "true", valueType: "boolean", category: "ai", description: "Enable AI course generation", isPublic: false, isEditable: true },
    { key: "ai_default_model", value: "gpt-4o", valueType: "string", category: "ai", description: "Default AI model for generation", isPublic: false, isEditable: true },
    { key: "default_currency", value: "INR", valueType: "string", category: "finance", description: "Default currency", isPublic: true, isEditable: true },
    { key: "gst_rate", value: "18", valueType: "number", category: "finance", description: "GST rate percentage", isPublic: true, isEditable: true },
  ];

  await db.insert(platformSettings).values(settings).onConflictDoNothing();
  console.log(`Inserted ${settings.length} platform settings`);

  // ==================== SEED CREDIT POLICIES ====================
  const creditPoliciesData = [
    { name: "Beginner Course", description: "Standard pricing for beginner level courses", courseLevel: "beginner", baseCredits: 800, priceInr: 1999, priceUsd: 25, isDefault: true, isActive: true },
    { name: "Intermediate Course", description: "Standard pricing for intermediate level courses", courseLevel: "intermediate", baseCredits: 1600, priceInr: 3999, priceUsd: 50, isDefault: true, isActive: true },
    { name: "Advanced Course", description: "Standard pricing for advanced level courses", courseLevel: "advanced", baseCredits: 2400, priceInr: 5999, priceUsd: 75, isDefault: true, isActive: true },
    { name: "Expert Course", description: "Premium pricing for expert level courses", courseLevel: "expert", baseCredits: 4000, priceInr: 9999, priceUsd: 125, isDefault: true, isActive: true },
  ];

  await db.insert(creditPolicies).values(creditPoliciesData).onConflictDoNothing();
  console.log(`Inserted ${creditPoliciesData.length} credit policies`);

  // ==================== SEED APPROVAL TEMPLATES ====================
  const approvalTemplatesData = [
    {
      name: "course_publish",
      description: "Approval workflow for publishing courses",
      entityType: "course",
      stepsConfig: [
        { order: 1, roleRequired: "content_admin", isOptional: false },
        { order: 2, roleRequired: "admin", isOptional: false },
      ],
      isActive: true,
    },
    {
      name: "high_value_reward",
      description: "Approval for high-value reward disbursement",
      entityType: "reward",
      stepsConfig: [
        { order: 1, roleRequired: "support_admin", isOptional: false },
        { order: 2, roleRequired: "finance_admin", isOptional: false },
      ],
      isActive: true,
    },
    {
      name: "refund_request",
      description: "Approval workflow for refund requests",
      entityType: "refund",
      stepsConfig: [
        { order: 1, roleRequired: "support_admin", isOptional: false },
        { order: 2, roleRequired: "finance_admin", isOptional: false },
      ],
      isActive: true,
    },
    {
      name: "ai_rule_approval",
      description: "Approval for new AI rules and configurations",
      entityType: "ai_rule",
      stepsConfig: [
        { order: 1, roleRequired: "content_admin", isOptional: false },
        { order: 2, roleRequired: "super_admin", isOptional: false },
      ],
      isActive: true,
    },
  ];

  await db.insert(approvalTemplates).values(approvalTemplatesData).onConflictDoNothing();
  console.log(`Inserted ${approvalTemplatesData.length} approval templates`);

  // ==================== SEED AI MODEL REGISTRY ====================
  const aiModels = [
    {
      name: "GPT-4o",
      provider: "openai",
      modelId: "gpt-4o",
      version: "2024-08-06",
      capabilities: ["text_generation", "course_generation", "content_analysis"],
      costPerToken: 5,
      maxTokens: 128000,
      isDefault: true,
      isActive: true,
      metadata: { description: "Most capable model for complex tasks" },
    },
    {
      name: "GPT-4o Mini",
      provider: "openai",
      modelId: "gpt-4o-mini",
      version: "2024-07-18",
      capabilities: ["text_generation", "quick_generation"],
      costPerToken: 1,
      maxTokens: 128000,
      isDefault: false,
      isActive: true,
      metadata: { description: "Cost-effective model for simpler tasks" },
    },
  ];

  await db.insert(aiModelRegistry).values(aiModels).onConflictDoNothing();
  console.log(`Inserted ${aiModels.length} AI model configurations`);

  console.log("Enterprise seed data completed successfully!");
}

// Export for CLI usage
export default seedEnterpriseData;
