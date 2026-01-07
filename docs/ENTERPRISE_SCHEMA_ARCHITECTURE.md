# OurShiksha Enterprise Database Architecture

## Version 2.0 - Enterprise Schema Design

### Schema Philosophy

The enterprise schema follows these principles:
1. **Single Database** - One PostgreSQL database (`ourshiksha_db`)
2. **Logical Separation** - Tables prefixed by domain (admin_, course_, reward_, etc.)
3. **RBAC Foundation** - Role-based access control at the database level
4. **Complete Auditability** - Every admin action is traceable
5. **Soft Deletes Only** - No hard deletes for audit compliance
6. **Approval Workflows** - Multi-step approval for sensitive actions

---

## Schema Domains

### 1. ADMIN IDENTITY & ACCESS CONTROL
Controls who can do what in the system.

| Table | Purpose |
|-------|---------|
| `admin_roles` | Role definitions (super_admin, admin, content_admin, etc.) |
| `admin_permissions` | Granular permission definitions |
| `admin_role_permissions` | Maps permissions to roles |
| `admin_user_roles` | Assigns roles to users |

### 2. APPROVAL WORKFLOWS
Multi-step approval for sensitive actions.

| Table | Purpose |
|-------|---------|
| `approval_templates` | Predefined workflow templates |
| `approval_requests` | Pending approval items |
| `approval_steps` | Steps within each request |
| `approval_actions` | Actions taken on approvals |

### 3. COURSE FACTORY CONTROL
Version control and quality assurance for courses.

| Table | Purpose |
|-------|---------|
| `course_versions` | Version history for courses |
| `course_publish_history` | Publish/unpublish audit trail |
| `course_quality_checks` | Quality validation results |

### 4. PLATFORM POLICIES & CONFIG
Centralized configuration management.

| Table | Purpose |
|-------|---------|
| `platform_settings` | Global system settings |
| `credit_policies` | Credit pricing rules |
| `scholarship_policies` | Scholarship eligibility rules |
| `pricing_rules` | Dynamic pricing configuration |

### 5. AI GOVERNANCE
Oversight and control of AI-generated content.

| Table | Purpose |
|-------|---------|
| `ai_rule_registry` | Registered AI generation rules |
| `ai_model_registry` | AI model metadata and configs |
| `ai_rule_approvals` | Approval queue for AI rules |

### 6. CERTIFICATION CONTROL
Academic integrity and certificate management.

| Table | Purpose |
|-------|---------|
| `certificate_templates` | Certificate design templates |
| `signer_registry` | Authorized certificate signers |
| `academic_authorities` | Accreditation authorities |

### 7. ENHANCED AUDIT & MONITORING
Comprehensive audit trail.

| Table | Purpose |
|-------|---------|
| `data_access_logs` | Tracks who accessed what data |
| `escalation_logs` | Security escalations |
| `admin_security_logs` | Security-related events |

---

## RBAC Permission Matrix

### Roles Hierarchy
```
super_admin
  └── admin
        ├── content_admin
        ├── finance_admin
        ├── support_admin
        └── readonly_admin
```

### Permission Categories
- `courses.*` - Course management
- `users.*` - User management
- `rewards.*` - Reward management
- `certificates.*` - Certificate management
- `settings.*` - System settings
- `ai.*` - AI governance
- `reports.*` - Analytics and reports

### Example Permissions
| Permission | Description |
|------------|-------------|
| `courses.create` | Create new courses |
| `courses.publish` | Publish courses |
| `courses.delete` | Delete courses |
| `users.manage` | Manage admin users |
| `rewards.approve` | Approve rewards |
| `settings.modify` | Modify system settings |

---

## Approval Workflow Types

### Course Publishing
1. Content admin creates course
2. Quality check runs automatically
3. Senior admin reviews
4. Super admin approves publication

### Reward Approval
1. AI/System triggers reward
2. Risk score calculated
3. Low risk: Auto-approved
4. High risk: Manual review required

### User Management
1. Invitation sent
2. OTP verification
3. Admin approval (for new admins)
4. Role assignment

---

## Migration Strategy

### Phase 1: Add Tables
- Create new tables without breaking existing functionality
- All new tables are additive

### Phase 2: Seed Data
- Create default roles and permissions
- Set up super_admin role
- Configure default policies

### Phase 3: Migrate Logic
- Update routes to check permissions
- Implement approval workflows
- Add audit logging

### Phase 4: Enforce
- Enable RBAC enforcement
- Require approvals where configured
- Enable comprehensive logging

---

## Entity Relationship Summary

```
admin_roles ──┬── admin_role_permissions ──── admin_permissions
              │
              └── admin_user_roles ──── users

approval_templates ── approval_requests ──┬── approval_steps
                                         └── approval_actions

courses ──── course_versions ──── course_publish_history
         └── course_quality_checks

platform_settings
credit_policies
scholarship_policies
pricing_rules

ai_rule_registry ── ai_rule_approvals
ai_model_registry

certificate_templates
signer_registry
academic_authorities

data_access_logs
escalation_logs
admin_security_logs
```

---

## Security Considerations

1. **Soft Deletes** - All entities use `deleted_at` instead of hard delete
2. **Audit Triggers** - Automatic logging of all changes
3. **Encryption** - Sensitive fields encrypted at rest
4. **Access Logging** - Every data access logged
5. **Separation of Duties** - Critical actions require dual approval
6. **Session Management** - Automatic session invalidation

---

## Retention Policies

| Data Type | Retention Period |
|-----------|-----------------|
| Audit logs | 7 years |
| Session data | 90 days |
| Access logs | 2 years |
| Course versions | Permanent |
| Deleted records | 1 year soft delete |

---

## Implementation Timeline

- **Week 1**: RBAC tables + Admin roles/permissions
- **Week 2**: Approval workflows + Course versioning
- **Week 3**: AI governance + Platform policies
- **Week 4**: Certification control + Enhanced audit
- **Week 5**: Backend integration + Testing
- **Week 6**: Frontend updates + Final testing
