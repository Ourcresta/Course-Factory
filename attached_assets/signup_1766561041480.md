# SHISHYA Authentication System Documentation

## Overview

The SHISHYA student portal implements a secure email-based authentication system with OTP (One-Time Password) verification using the Resend email service. This document explains the complete signup and login process, including all secrets, files, and code involved.

---

## Secrets Required

The authentication system requires the following secrets configured in the Replit environment:

| Secret Name | Purpose | How to Get |
|-------------|---------|------------|
| `RESEND_API_KEY` | Send OTP emails via Resend | Get from [resend.com](https://resend.com) dashboard |
| `SESSION_SECRET` | Sign session cookies (optional) | Generate a random 32+ character string |
| `DATABASE_URL` | PostgreSQL connection for storing users/sessions | Automatically provided by Replit PostgreSQL |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                             │
├─────────────────────────────────────────────────────────────────────┤
│  client/src/auth/Signup.tsx     - Signup form UI                     │
│  client/src/auth/Login.tsx      - Login form UI                      │
│  client/src/auth/VerifyOtp.tsx  - OTP verification UI                │
│  client/src/contexts/AuthContext.tsx - Auth state management         │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │ API Calls
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Express)                            │
├─────────────────────────────────────────────────────────────────────┤
│  server/auth.ts           - Main auth routes & middleware            │
│  server/resend.ts         - Email sending via Resend                 │
│  server/lib/otp-utils.ts  - OTP generation & hashing                 │
│  server/lib/otp-db.ts     - OTP database operations                  │
│  server/lib/otp-email.ts  - Email templates                          │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │ SQL Queries
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE (PostgreSQL)                        │
├─────────────────────────────────────────────────────────────────────┤
│  users           - User accounts with hashed passwords               │
│  sessions        - Active login sessions                             │
│  otp_logs        - OTP records with hash, attempts, expiry           │
│  user_credits    - Welcome bonus credits for new users               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### File: `shared/schema.ts`

```typescript
// Users table
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sessions table for login persistence
export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// OTP logs table for email verification
export const otpLogs = pgTable("otp_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  contactType: varchar("contact_type", { length: 10 }).notNull().default("email"),
  destination: varchar("destination", { length: 255 }).notNull(),
  otpHash: text("otp_hash").notNull(),  // SHA256 hashed OTP
  purpose: varchar("purpose", { length: 20 }).notNull(),
  attemptCount: integer("attempt_count").notNull().default(0),
  expiresAt: timestamp("expires_at").notNull(),
  consumedAt: timestamp("consumed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

## Signup Flow

### Step 1: User Submits Signup Form

**Frontend File:** `client/src/auth/Signup.tsx`

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
  // Navigate to OTP verification on success
};
```

### Step 2: Backend Creates User & Sends OTP

**Backend File:** `server/auth.ts`

```typescript
// POST /api/auth/signup
authRouter.post("/signup", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  // Check if user exists
  const existingUser = await getUserByEmail(normalizedEmail);
  
  if (existingUser && existingUser.emailVerified) {
    return res.status(400).json({ error: "Email already registered" });
  }

  // Hash password with bcrypt (12 rounds)
  const passwordHash = await bcrypt.hash(password, 12);
  const userId = randomUUID();
  
  // Create user in database
  await db.insert(users).values({
    id: userId,
    email: normalizedEmail,
    passwordHash,
    emailVerified: false,
  });

  // Generate 6-digit OTP
  const otp = generateOTP();
  
  // Store hashed OTP in database
  await createOTPRecord(userId, "email", normalizedEmail, otp, "signup");

  // Send OTP via Resend
  await sendOtpEmail(normalizedEmail, otp, "signup");

  res.json({ message: "Verification code sent to your email" });
});
```

### Step 3: OTP Generation & Hashing

**File:** `server/lib/otp-utils.ts`

```typescript
import { createHash } from "crypto";

// OTP Configuration
export const OTP_CONFIG = {
  EXPIRY_MINUTES: 5,      // OTP valid for 5 minutes
  MAX_ATTEMPTS: 3,        // Max wrong attempts before lockout
  RESEND_COOLDOWN_SECONDS: 30,  // Wait time between resends
  CODE_LENGTH: 6,         // 6-digit code
};

// Generate random 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Hash OTP using SHA256 (never store plain OTP)
export function hashOTP(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

// Verify OTP against stored hash
export function verifyOTPHash(otp: string, hash: string): boolean {
  return hashOTP(otp) === hash;
}
```

### Step 4: Store OTP Record

**File:** `server/lib/otp-db.ts`

```typescript
export async function createOTPRecord(
  userId: string | null,
  contactType: "email" | "mobile",
  destination: string,
  otp: string,
  purpose: OtpPurpose
): Promise<void> {
  await db.insert(otpLogs).values({
    userId,
    contactType,
    destination: destination.toLowerCase().trim(),
    otpHash: hashOTP(otp),  // Store hash, not plain OTP
    purpose,
    expiresAt: getOTPExpiry(),  // 5 minutes from now
    attemptCount: 0,
    consumedAt: null,
  });
}
```

### Step 5: Send Email via Resend

**File:** `server/resend.ts`

```typescript
import { Resend } from 'resend';

const DEFAULT_FROM_EMAIL = 'OurShiksha <noreply@mail.dishabrooms.com>';

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;  // Secret from environment
  
  if (!apiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }
  
  return {
    client: new Resend(apiKey),
    fromEmail: DEFAULT_FROM_EMAIL
  };
}

export async function sendOtpEmail(
  toEmail: string, 
  otp: string, 
  purpose: OtpPurpose
): Promise<boolean> {
  const { client, fromEmail } = getResendClient();
  const { subject, html } = getOTPEmailTemplate(otp, purpose);
  
  const result = await client.emails.send({
    from: fromEmail,
    to: toEmail,
    subject,
    html,
  });
  
  return !!result?.data?.id;
}
```

### Step 6: User Enters OTP

**Frontend File:** `client/src/auth/VerifyOtp.tsx`

```typescript
const handleVerify = async (e: React.FormEvent) => {
  e.preventDefault();
  const response = await fetch("/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
    credentials: "include",
  });
  // Login user on success
};
```

### Step 7: Verify OTP & Create Session

**Backend File:** `server/auth.ts`

```typescript
// POST /api/auth/verify-otp
authRouter.post("/verify-otp", async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await getUserByEmail(normalizedEmail);
  if (!user) {
    return res.status(400).json({ error: "Invalid email or verification code" });
  }

  // Verify OTP against database
  const verifyResult = await verifyOTPRecord(normalizedEmail, otp, "signup");
  
  if (!verifyResult.valid) {
    return res.status(400).json({ error: verifyResult.message });
  }

  // Mark email as verified
  await db.update(users)
    .set({ emailVerified: true })
    .where(eq(users.id, user.id));

  // Grant 500 welcome bonus credits
  await db.insert(userCredits).values({
    userId: user.id,
    balance: 500,
    totalEarned: 500,
    totalSpent: 0,
  });

  // Create session
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);  // 7 days

  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    expiresAt,
  });

  // Set HTTP-only cookie
  res.cookie("shishya_session", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    message: "Email verified successfully",
    user: { id: user.id, email: user.email, emailVerified: true },
    welcomeBonus: 500,
  });
});
```

---

## Login Flow

### Step 1: User Submits Login Form

**Frontend File:** `client/src/auth/Login.tsx`

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
  // Redirect to dashboard on success
};
```

### Step 2: Backend Validates Credentials

**Backend File:** `server/auth.ts`

```typescript
// POST /api/auth/login
authRouter.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await getUserByEmail(normalizedEmail);
  if (!user) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  // Verify password with bcrypt
  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  // Check if email is verified
  if (!user.emailVerified) {
    return res.status(400).json({ 
      error: "Please verify your email first", 
      needsVerification: true 
    });
  }

  // Create session
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    expiresAt,
  });

  // Set HTTP-only cookie
  res.cookie("shishya_session", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    message: "Login successful",
    user: { id: user.id, email: user.email, emailVerified: user.emailVerified },
  });
});
```

---

## Session Management

### Check Current User

**Backend File:** `server/auth.ts`

```typescript
// GET /api/auth/me
authRouter.get("/me", async (req: Request, res: Response) => {
  const sessionId = req.cookies?.["shishya_session"];
  if (!sessionId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // Find valid session
  const sessionResult = await db.select()
    .from(sessions)
    .where(and(
      eq(sessions.id, sessionId),
      gt(sessions.expiresAt, new Date())
    ))
    .limit(1);

  if (sessionResult.length === 0) {
    res.clearCookie("shishya_session");
    return res.status(401).json({ error: "Session expired" });
  }

  // Get user
  const userResult = await db.select()
    .from(users)
    .where(eq(users.id, sessionResult[0].userId))
    .limit(1);

  res.json({
    user: {
      id: userResult[0].id,
      email: userResult[0].email,
      emailVerified: userResult[0].emailVerified,
    },
  });
});
```

### Logout

**Backend File:** `server/auth.ts`

```typescript
// POST /api/auth/logout
authRouter.post("/logout", async (req: Request, res: Response) => {
  const sessionId = req.cookies?.["shishya_session"];
  if (sessionId) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  res.clearCookie("shishya_session");
  res.json({ message: "Logged out successfully" });
});
```

---

## Auth Context (Frontend)

**File:** `client/src/contexts/AuthContext.tsx`

```typescript
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## Security Features

### 1. Password Security
- Passwords hashed with **bcrypt** (12 salt rounds)
- Plain passwords never stored

### 2. OTP Security
- OTPs hashed with **SHA256** before storage
- **5-minute expiry** for OTPs
- **3 max attempts** before lockout
- **30-second cooldown** between resends
- Previous OTPs invalidated on new request

### 3. Session Security
- **HTTP-only cookies** (no JavaScript access)
- **Secure flag** in production (HTTPS only)
- **SameSite=lax** (CSRF protection)
- **7-day expiry** with database validation
- Sessions stored in PostgreSQL (not memory)

### 4. Input Validation
- Email normalized (lowercase, trimmed)
- Zod schemas validate all inputs
- Password strength requirements

---

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/signup` | Create account & send OTP |
| POST | `/api/auth/verify-otp` | Verify OTP & complete signup |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/logout` | Logout & clear session |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/resend-otp` | Resend verification code |
| POST | `/api/auth/send-otp` | Generic OTP sender |

---

## File Structure

```
server/
├── auth.ts              # Main auth routes & middleware
├── resend.ts            # Email sending via Resend
├── db.ts                # Database connection
└── lib/
    ├── otp-utils.ts     # OTP generation & hashing
    ├── otp-db.ts        # OTP database operations
    └── otp-email.ts     # Email templates

client/src/
├── auth/
│   ├── Login.tsx        # Login form
│   ├── Signup.tsx       # Signup form
│   └── VerifyOtp.tsx    # OTP verification form
└── contexts/
    └── AuthContext.tsx  # Auth state management

shared/
└── schema.ts            # Database schemas & types
```

---

## Setup Instructions

1. **Create PostgreSQL Database**
   - Use Replit's built-in PostgreSQL

2. **Configure Secrets**
   - Add `RESEND_API_KEY` from resend.com

3. **Run Database Migrations**
   ```bash
   npm run db:push
   ```

4. **Start Application**
   ```bash
   npm run dev
   ```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| OTP email not received | Check RESEND_API_KEY is valid |
| Session not persisting | Ensure cookies enabled in browser |
| "Session expired" error | Clear cookies and login again |
| "Email already registered" | User exists with verified email |
