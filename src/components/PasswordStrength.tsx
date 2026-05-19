"use client";

interface StrengthMetrics {
  label: "Weak" | "Fair" | "Strong";
  color: "bg-red-500" | "bg-yellow-400" | "bg-green-500";
  width: "33%" | "66%" | "100%";
  labelClass: "text-red-600" | "text-yellow-700" | "text-green-700";
}

interface PasswordStrengthProps {
  password?: string;
}

export function PasswordStrengthIndicator({ password = "" }: PasswordStrengthProps) {
  const getStrength = (pwd: string): StrengthMetrics => {
    const hasLower = /[a-z]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSymbol = /[^a-zA-Z0-9]/.test(pwd);

    // 1. Weak check: length < 8
    if (pwd.length < 8) {
      return {
        label: "Weak",
        color: "bg-red-500",
        width: "33%",
        labelClass: "text-red-600",
      };
    }

    // 2. Strong check: length >= 10 and hasLower and hasUpper and hasNumber and hasSymbol
    if (pwd.length >= 10 && hasLower && hasUpper && hasNumber && hasSymbol) {
      return {
        label: "Strong",
        color: "bg-green-500",
        width: "100%",
        labelClass: "text-green-700",
      };
    }

    // 3. Fair check: length >= 8 and (hasLower or hasUpper) and (hasNumber or hasSymbol)
    if (pwd.length >= 8 && (hasLower || hasUpper) && (hasNumber || hasSymbol)) {
      return {
        label: "Fair",
        color: "bg-yellow-400",
        width: "66%",
        labelClass: "text-yellow-700",
      };
    }

    // 4. Fallback (e.g. length >= 8 but lacking required casing, numbers or symbols)
    return {
      label: "Weak",
      color: "bg-red-500",
      width: "33%",
      labelClass: "text-red-600",
    };
  };

  if (!password) return null;

  const strength = getStrength(password);

  return (
    <div className="mt-2 space-y-1.5" aria-live="polite">
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
          style={{ width: strength.width }}
        />
      </div>
      <p className={`text-xs font-semibold ${strength.labelClass}`}>
        Password Strength: {strength.label}
      </p>
    </div>
  );
}
