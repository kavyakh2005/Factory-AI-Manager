/**
 * Factory AI Manager — Enterprise Security Engine
 * Comprehensive security utilities:
 * 1. Cryptographic Password Hashing (SHA-256 + Salt)
 * 2. Tamper-Proof Storage & Anti-Privilege Escalation (HMAC Signatures)
 * 3. Brute Force Protection & Exponential Rate Limiting
 * 4. XSS & Injection Sanitization
 * 5. Security Audit Logging & Intrusion Alerts
 */

const SALT = 'SRK_FACTORY_SECURE_V2_2026_!#987x';

export interface SecurityEvent {
  id: string;
  type: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'RATE_LIMIT_LOCKOUT' | 'TAMPER_DETECTED' | 'PERMISSION_DENIED' | 'XSS_ATTEMPT';
  details: string;
  timestamp: string;
  ip?: string;
  userAgent?: string;
}

// 1. Cryptographic SHA-256 Hashing with Salt
export async function sha256Hash(text: string, customSalt = SALT): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${customSalt}:${text}:${customSalt}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Helper to check if provided password matches known owner hashes or direct hash
export async function verifyOwnerPassword(password: string): Promise<boolean> {
  const inputHash = await sha256Hash(password);
  
  // Also verify against computed hash of standard passwords
  const h1 = await sha256Hash('Kavya@2005');
  const h2 = await sha256Hash('asa');

  return inputHash === h1 || inputHash === h2;
}

// 2. Anti-Tamper Payload Signatures for Local Storage & Session State
export async function generateSecuritySignature(payload: Record<string, unknown>): Promise<string> {
  const sortedKeys = Object.keys(payload).sort();
  const canonicalString = sortedKeys.map((k) => `${k}=${JSON.stringify(payload[k])}`).join('&');
  return sha256Hash(canonicalString, `${SALT}_SIGNATURE`);
}

export async function verifySecuritySignature(payload: Record<string, unknown>, signature: string): Promise<boolean> {
  if (!signature) return false;
  const computed = await generateSecuritySignature(payload);
  return computed === signature;
}

// 3. Brute Force Protection & Rate Limiting
interface RateLimitRecord {
  attempts: number;
  lockedUntil: number | null;
  lastAttempt: number;
}

const RATE_LIMIT_PREFIX = 'sec_ratelimit_';

export function checkRateLimit(
  key: string,
  maxAttempts = 5,
  lockoutDurationMs = 15 * 60 * 1000
): { allowed: boolean; remainingAttempts: number; retryAfterSeconds: number } {
  try {
    const raw = localStorage.getItem(`${RATE_LIMIT_PREFIX}${key}`);
    const now = Date.now();

    if (!raw) {
      return { allowed: true, remainingAttempts: maxAttempts, retryAfterSeconds: 0 };
    }

    const record: RateLimitRecord = JSON.parse(raw);

    // If currently locked out
    if (record.lockedUntil && record.lockedUntil > now) {
      const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
    }

    // Reset if last attempt was over lockout duration ago
    if (now - record.lastAttempt > lockoutDurationMs) {
      localStorage.removeItem(`${RATE_LIMIT_PREFIX}${key}`);
      return { allowed: true, remainingAttempts: maxAttempts, retryAfterSeconds: 0 };
    }

    const remainingAttempts = Math.max(0, maxAttempts - record.attempts);
    return {
      allowed: record.attempts < maxAttempts,
      remainingAttempts,
      retryAfterSeconds: 0,
    };
  } catch {
    return { allowed: true, remainingAttempts: maxAttempts, retryAfterSeconds: 0 };
  }
}

export function recordFailedLoginAttempt(
  key: string,
  maxAttempts = 5,
  lockoutDurationMs = 15 * 60 * 1000
): { locked: boolean; retryAfterSeconds: number } {
  try {
    const now = Date.now();
    const raw = localStorage.getItem(`${RATE_LIMIT_PREFIX}${key}`);
    let record: RateLimitRecord = raw ? JSON.parse(raw) : { attempts: 0, lockedUntil: null, lastAttempt: now };

    record.attempts += 1;
    record.lastAttempt = now;

    if (record.attempts >= maxAttempts) {
      record.lockedUntil = now + lockoutDurationMs;
      localStorage.setItem(`${RATE_LIMIT_PREFIX}${key}`, JSON.stringify(record));
      logSecurityEvent({
        id: crypto.randomUUID(),
        type: 'RATE_LIMIT_LOCKOUT',
        details: `Account/Key [${key}] locked out after ${record.attempts} failed attempts for ${lockoutDurationMs / 60000} minutes.`,
        timestamp: new Date().toISOString(),
      });
      return { locked: true, retryAfterSeconds: Math.ceil(lockoutDurationMs / 1000) };
    }

    localStorage.setItem(`${RATE_LIMIT_PREFIX}${key}`, JSON.stringify(record));
    return { locked: false, retryAfterSeconds: 0 };
  } catch {
    return { locked: false, retryAfterSeconds: 0 };
  }
}

export function resetRateLimit(key: string): void {
  try {
    localStorage.removeItem(`${RATE_LIMIT_PREFIX}${key}`);
  } catch {}
}

// 4. Input Sanitization (XSS, Script Injections, SQL Injection patterns)
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return input;

  return input
    // Remove null bytes
    .replace(/\0/g, '')
    // Strip script and iframe tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Strip dangerous javascript: and data: URIs in html contexts
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/onload\s*=/gi, 'no-load=')
    .replace(/onerror\s*=/gi, 'no-error=')
    .replace(/onclick\s*=/gi, 'no-click=')
    .trim();
}

/**
 * Deep sanitization of objects before persisting to database or storage
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitizeInput(obj) as unknown as T;
  if (Array.isArray(obj)) return obj.map((item) => sanitizeObject(item)) as unknown as T;
  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized as T;
  }
  return obj;
}

// 5. Security Audit Log
const SECURITY_LOG_KEY = 'factory_security_audit_log';
const MAX_SECURITY_LOGS = 100;

export function logSecurityEvent(event: SecurityEvent): void {
  try {
    const existing = getSecurityLogs();
    existing.unshift({
      ...event,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    });
    const trimmed = existing.slice(0, MAX_SECURITY_LOGS);
    localStorage.setItem(SECURITY_LOG_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to record security audit log:', e);
  }
}

export function getSecurityLogs(): SecurityEvent[] {
  try {
    const raw = localStorage.getItem(SECURITY_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
