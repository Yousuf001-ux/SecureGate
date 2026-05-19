export function renderResetPasswordHtml(name: string, resetLink: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background-color:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;padding:40px 20px;min-height:100%;margin:0;">
  <div style="background-color:#FFFFFF;border:1px solid #E5E7EB;border-radius:12px;margin:0 auto;max-width:500px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
    <h1 style="color:#2563EB;font-size:22px;font-weight:bold;margin:0 0 24px 0;text-align:center;letter-spacing:-0.025em;">SecureGate</h1>
    <h2 style="color:#111827;font-size:20px;font-weight:600;margin:0 0 16px 0;">Reset Your Password</h2>
    <p style="color:#4B5563;font-size:14px;line-height:1.6;margin:0 0 16px 0;">Hello ${name || "there"},</p>
    <p style="color:#4B5563;font-size:14px;line-height:1.6;margin:0 0 16px 0;">We received a request to reset the password associated with your SecureGate account. To select a new password and log back in, please click the button below:</p>
    <div style="margin:24px 0;text-align:center;">
      <a href="${resetLink}" target="_blank" rel="noopener noreferrer" style="background-color:#2563EB;border-radius:8px;color:#FFFFFF;display:inline-block;font-size:14px;font-weight:500;padding:12px 24px;text-decoration:none;">Reset Password</a>
    </div>
    <p style="color:#B45309;background-color:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;font-size:13px;line-height:1.5;margin:24px 0 0 0;padding:12px 16px;"><strong>Security Notice:</strong> This password reset link will expire in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email; your password will remain unchanged.</p>
    <hr style="border:none;border-top:1px solid #E5E7EB;margin:32px 0 16px 0;" />
    <p style="color:#9CA3AF;font-size:12px;line-height:1.5;margin:0;text-align:center;">This is an automated security transmission from SecureGate. Please do not reply directly to this message.</p>
  </div>
</body>
</html>`;
}
