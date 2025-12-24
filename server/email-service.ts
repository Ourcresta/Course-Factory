import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

async function getResendClient() {
  const credentials = await getCredentials();
  return {
    client: new Resend(credentials.apiKey),
    fromEmail: credentials.fromEmail
  };
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTPEmail(toEmail: string, otp: string, customMessage?: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const subject = customMessage 
      ? 'New Admin Signup Request - OurShiksha'
      : 'OurShiksha Admin Verification Code';
    
    const headerText = customMessage || 'Admin Verification Code';
    const contextText = customMessage 
      ? `<p style="color: #444; font-size: 16px; line-height: 1.5; margin-bottom: 16px;">${customMessage}</p><p style="color: #444; font-size: 16px; line-height: 1.5;">Approval verification code:</p>`
      : `<p style="color: #444; font-size: 16px; line-height: 1.5;">Your One-Time Verification Code is:</p>`;
    
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

    console.log('[Email Service] OTP email sent successfully to:', toEmail);
    return true;
  } catch (error) {
    console.error('[Email Service] Failed to send OTP email:', error);
    return false;
  }
}
