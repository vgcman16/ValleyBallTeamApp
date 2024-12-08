interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isStrong: boolean;
}

export const validatePassword = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length < 8) {
    feedback.push('Password should be at least 8 characters long');
  } else {
    score += 1;
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    feedback.push('Include at least one uppercase letter');
  } else {
    score += 1;
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    feedback.push('Include at least one lowercase letter');
  } else {
    score += 1;
  }

  // Number check
  if (!/\d/.test(password)) {
    feedback.push('Include at least one number');
  } else {
    score += 1;
  }

  // Special character check
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    feedback.push('Include at least one special character');
  } else {
    score += 1;
  }

  // Common patterns check
  const commonPatterns = [
    '123456', 'password', 'qwerty', 'abc123',
    'letmein', 'admin', 'welcome', 'monkey'
  ];
  
  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    feedback.push('Avoid common password patterns');
    score = Math.max(0, score - 1);
  }

  // Sequential characters check
  if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password)) {
    feedback.push('Avoid sequential characters');
    score = Math.max(0, score - 1);
  }

  // Repeated characters check
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Avoid repeating characters');
    score = Math.max(0, score - 1);
  }

  return {
    score,
    feedback: feedback.length ? feedback : ['Password strength is good'],
    isStrong: score >= 4 && feedback.length <= 1
  };
};

export const getPasswordStrengthColor = (score: number): string => {
  switch (score) {
    case 0:
      return '#ff4444'; // Red
    case 1:
      return '#ffbb33'; // Orange
    case 2:
      return '#ffeb3b'; // Yellow
    case 3:
      return '#00C851'; // Light green
    case 4:
    case 5:
      return '#007E33'; // Dark green
    default:
      return '#ff4444';
  }
};
