import type { Express, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { storage } from './storage';
import { generateOTP, sendOTPEmail } from './email-service';
import { generateToken, authRateLimiter, otpRateLimiter } from './auth-middleware';

const OTP_EXPIRY_MINUTES = 5;
const MAX_OTP_ATTEMPTS = 3;
const BCRYPT_ROUNDS = 12;
const ADMIN_APPROVAL_EMAIL = 'ourcresta@gmail.com';

interface PendingSignup {
  username: string;
  email: string;
  hashedPassword: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

const pendingSignups = new Map<string, PendingSignup>();

function cleanupExpiredSignups() {
  const now = new Date();
  const entries = Array.from(pendingSignups.entries());
  for (const [email, signup] of entries) {
    if (now > signup.expiresAt) {
      pendingSignups.delete(email);
    }
  }
}

setInterval(cleanupExpiredSignups, 60000);

const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
});

const signupSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const verifyOtpSchema = z.object({
  email: z.string().email('Valid email required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export function registerAuthRoutes(app: Express) {
  app.post('/api/admin/auth/login', authRateLimiter, async (req: Request, res: Response) => {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: validation.error.errors 
        });
      }

      const { email, password } = validation.data;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ 
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }

      if (user.role !== 'admin') {
        return res.status(403).json({ 
          error: 'Access denied',
          message: 'Only admin users can access this portal'
        });
      }

      await storage.updateUserLastLogin(user.id);

      const token = generateToken({
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      });

      await storage.createAuditLog({
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        entityType: 'AUTH',
        entityId: null,
        metadata: { email, ip: req.ip }
      });

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('[Auth] Login error:', error);
      res.status(500).json({ 
        error: 'Login failed',
        message: 'An unexpected error occurred'
      });
    }
  });

  app.post('/api/admin/auth/signup', authRateLimiter, async (req: Request, res: Response) => {
    try {
      const validation = signupSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: validation.error.errors 
        });
      }

      const { username, email, password } = validation.data;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ 
          error: 'Email already exists',
          message: 'An account with this email already exists. Please sign in.'
        });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ 
          error: 'Username already exists',
          message: 'This username is already taken. Please choose another.'
        });
      }

      const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const otp = generateOTP();
      const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      pendingSignups.set(email.toLowerCase(), {
        username,
        email,
        hashedPassword,
        otpHash,
        expiresAt,
        attempts: 0,
        createdAt: new Date(),
      });

      console.log(`[Auth] Pending signup stored for ${email}, OTP: ${otp}`);

      const emailSent = await sendOTPEmail(
        ADMIN_APPROVAL_EMAIL, 
        otp, 
        `New admin signup request from ${username} (${email})`
      );
      
      if (!emailSent) {
        pendingSignups.delete(email.toLowerCase());
        return res.status(500).json({ 
          error: 'Email delivery failed',
          message: 'Unable to send verification code. Please try again.'
        });
      }

      res.json({ 
        success: true,
        message: 'Verification code sent to admin for approval',
        email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
      });
    } catch (error) {
      console.error('[Auth] Signup error:', error);
      res.status(500).json({ 
        error: 'Signup failed',
        message: 'An unexpected error occurred'
      });
    }
  });

  app.post('/api/admin/auth/verify-signup', otpRateLimiter, async (req: Request, res: Response) => {
    try {
      const validation = verifyOtpSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: validation.error.errors 
        });
      }

      const { email, otp } = validation.data;
      const emailKey = email.toLowerCase();

      const pendingSignup = pendingSignups.get(emailKey);
      if (!pendingSignup) {
        return res.status(401).json({ 
          error: 'No pending signup',
          message: 'No pending signup found for this email. Please sign up again.'
        });
      }

      if (new Date() > pendingSignup.expiresAt) {
        pendingSignups.delete(emailKey);
        return res.status(401).json({ 
          error: 'OTP expired',
          message: 'Verification code has expired. Please sign up again.'
        });
      }

      if (pendingSignup.attempts >= MAX_OTP_ATTEMPTS) {
        pendingSignups.delete(emailKey);
        return res.status(429).json({ 
          error: 'Too many attempts',
          message: 'Maximum verification attempts exceeded. Please sign up again.'
        });
      }

      const isOtpValid = await bcrypt.compare(otp, pendingSignup.otpHash);
      
      if (!isOtpValid) {
        pendingSignup.attempts++;
        const remainingAttempts = MAX_OTP_ATTEMPTS - pendingSignup.attempts;
        return res.status(401).json({ 
          error: 'Invalid OTP',
          message: `Incorrect code. ${remainingAttempts} attempts remaining.`
        });
      }

      const newUser = await storage.createUser({
        username: pendingSignup.username,
        email: pendingSignup.email,
        password: pendingSignup.hashedPassword,
        role: 'admin',
      });

      pendingSignups.delete(emailKey);

      await storage.updateUserLastLogin(newUser.id);

      const token = generateToken({
        userId: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: 'admin'
      });

      await storage.createAuditLog({
        userId: newUser.id,
        action: 'SIGNUP_SUCCESS',
        entityType: 'AUTH',
        entityId: null,
        metadata: { email, ip: req.ip }
      });

      res.json({
        success: true,
        message: 'Account created successfully',
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: 'admin'
        }
      });
    } catch (error) {
      console.error('[Auth] Signup verification error:', error);
      res.status(500).json({ 
        error: 'Verification failed',
        message: 'An unexpected error occurred'
      });
    }
  });

  app.post('/api/admin/auth/logout', async (req: Request, res: Response) => {
    res.json({ 
      success: true,
      message: 'Logged out successfully'
    });
  });

  app.get('/api/admin/auth/me', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        authenticated: false,
        message: 'Not authenticated'
      });
    }

    const token = authHeader.split(' ')[1];
    const { verifyToken } = await import('./auth-middleware');
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({ 
        authenticated: false,
        message: 'Invalid or expired token'
      });
    }

    const user = await storage.getUser(payload.userId);
    if (!user) {
      return res.status(401).json({ 
        authenticated: false,
        message: 'User not found'
      });
    }

    res.json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  });

  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      service: 'guru-admin-portal'
    });
  });
}
