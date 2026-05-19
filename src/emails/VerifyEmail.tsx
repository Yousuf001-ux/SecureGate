import React from "react";

interface VerifyEmailProps {
  name: string;
  verificationLink: string;
}

export function VerifyEmail({ name, verificationLink }: VerifyEmailProps) {
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={logoStyle}>SecureGate</h1>
        <h2 style={titleStyle}>Verify Your Account</h2>
        <p style={textStyle}>Hello {name || "there"},</p>
        <p style={textStyle}>
          Thank you for choosing SecureGate. To complete your registration and secure your profile, please verify your email address by clicking the button below:
        </p>
        
        <div style={buttonContainerStyle}>
          <a href={verificationLink} target="_blank" rel="noopener noreferrer" style={buttonStyle}>
            Verify Email Address
          </a>
        </div>

        <p style={warningTextStyle}>
          <strong>Security Notice:</strong> This verification link will expire in <strong>15 minutes</strong>. If you did not initiate this request, you can safely ignore this email.
        </p>

        <hr style={dividerStyle} />
        
        <p style={footerTextStyle}>
          This is an automated security transmission from SecureGate. Please do not reply directly to this message.
        </p>
      </div>
    </div>
  );
}

// Inline styles for high compatibility across diverse email clients
const containerStyle: React.CSSProperties = {
  backgroundColor: "#F9FAFB",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  padding: "40px 20px",
  minHeight: "100%",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  margin: "0 auto",
  maxWidth: "500px",
  padding: "32px",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
};

const logoStyle: React.CSSProperties = {
  color: "#2563EB",
  fontSize: "22px",
  fontWeight: "bold",
  margin: "0 0 24px 0",
  textAlign: "center",
  letterSpacing: "-0.025em",
};

const titleStyle: React.CSSProperties = {
  color: "#2563EB",
  fontSize: "20px",
  fontWeight: 600,
  margin: "0 0 16px 0",
};

const textStyle: React.CSSProperties = {
  color: "#4B5563",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 16px 0",
};

const buttonContainerStyle: React.CSSProperties = {
  margin: "24px 0",
  textAlign: "center",
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#2563EB",
  borderRadius: "8px",
  color: "#FFFFFF",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: "500",
  padding: "12px 24px",
  textDecoration: "none",
};

const warningTextStyle: React.CSSProperties = {
  color: "#B45309",
  backgroundColor: "#FFFBEB",
  border: "1px solid #FDE68A",
  borderRadius: "8px",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "24px 0 0 0",
  padding: "12px 16px",
};

const dividerStyle: React.CSSProperties = {
  border: "none",
  borderTop: "1px solid #E5E7EB",
  margin: "32px 0 16px 0",
};

const footerTextStyle: React.CSSProperties = {
  color: "#9CA3AF",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: 0,
  textAlign: "center",
};
