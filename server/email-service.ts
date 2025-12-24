import { Resend } from 'resend';
import { createHash } from 'crypto';

const DEFAULT_FROM_EMAIL = 'OurShiksha Admin <admin@mail.dishabrooms.com>';

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL;
  
  if (!apiKey) {
    throw new Error('RESEND_API_KEY not configured in environment secrets');
  }
  
  console.log('[Email Service] Using API key from environment (starts with):', apiKey.substring(0, 8) + '...');
  
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export function hashOTP(otp: string): string {
  return createHash('sha256').update(otp).digest('hex');
}

export function verifyOTPHash(otp: string, hash: string): boolean {
  return hashOTP(otp) === hash;
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTPEmail(toEmail: string, otp: string, customMessage?: string): Promise<boolean> {
  try {
    const { client, fromEmail } = getResendClient();
    
    const subject = customMessage 
      ? 'New Admin Signup Request - OurShiksha'
      : 'OurShiksha Admin Verification Code';
    
    const headerText = customMessage || 'Admin Verification Code';
    const contextText = customMessage 
      ? `<p style="color: #444; font-size: 16px; line-height: 1.5; margin-bottom: 16px;">${customMessage}</p><p style="color: #444; font-size: 16px; line-height: 1.5;">Approval verification code:</p>`
      : `<p style="color: #444; font-size: 16px; line-height: 1.5;">Your One-Time Verification Code is:</p>`;
    
    console.log('[Email Service] Sending email from:', fromEmail || 'OurShiksha Admin <admin@mail.dishabrooms.com>');
    console.log('[Email Service] Sending email to:', toEmail);
    
    const result = await client.emails.send({
      from: fromEmail || 'OurShiksha Admin <admin@mail.dishabrooms.com>',
      to: toEmail,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a1a; margin-bottom: 24px;">${headerText}</h2>
          ${contextText}
          <div style="background-color: #f5f5f5; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">${otp}</span>
          </div>
          <p style="color: #666; font-size: 14px; line-height: 1.5;">
            This code is valid for <strong>5 minutes</strong>.<br/>
            Do not share this code with anyone.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;"/>
          <p style="color: #999; font-size: 12px;">
            If you did not request this code, please ignore this email.
          </p>
        </div>
      `,
      text: `${customMessage ? customMessage + '\n\n' : ''}Verification Code: ${otp}\n\nThis code is valid for 5 minutes.\nDo not share this code with anyone.`
    });

    console.log('[Email Service] Resend API response:', JSON.stringify(result));
    
    if (result.error) {
      console.error('[Email Service] Resend error:', result.error);
      return false;
    }
    
    console.log('[Email Service] OTP email sent successfully to:', toEmail, 'ID:', result.data?.id);
    return true;
  } catch (error) {
    console.error('[Email Service] Failed to send OTP email:', error);
    return false;
  }
}
