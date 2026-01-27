/**
 * Validation utilities for form inputs
 */

/**
 * Validate email format
 * @param email - Email address to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with validation results
 */
export function validatePassword(password: string): {
  isValid: boolean;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  errors: string[];
} {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  const errors: string[] = [];
  if (!hasMinLength) errors.push('Password must be at least 8 characters');
  if (!hasUppercase) errors.push('Password must contain an uppercase letter');
  if (!hasLowercase) errors.push('Password must contain a lowercase letter');
  if (!hasNumber) errors.push('Password must contain a number');

  return {
    isValid: hasMinLength && hasUppercase && hasLowercase && hasNumber,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    errors,
  };
}

/**
 * Get user-friendly error message for common auth errors
 * @param error - Error message from auth service
 * @returns User-friendly error message
 */
export function getAuthErrorMessage(error: string): string {
  const errorLower = error.toLowerCase();

  if (
    errorLower.includes('invalid login credentials') ||
    errorLower.includes('invalid email or password')
  ) {
    return 'Invalid email or password. Please try again.';
  }

  if (errorLower.includes('email not confirmed')) {
    return 'Please verify your email before signing in.';
  }

  if (errorLower.includes('user already registered') || errorLower.includes('already exists')) {
    return 'An account with this email already exists. Try signing in instead.';
  }

  if (errorLower.includes('rate limit') || errorLower.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment before trying again.';
  }

  if (errorLower.includes('network') || errorLower.includes('connection')) {
    return 'Connection error. Please check your internet and try again.';
  }

  return error;
}
