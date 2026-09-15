import { create } from 'zustand';
import { User, Role } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabase/client';
import {
  verifyOwnerPassword,
  sha256Hash,
  generateSecuritySignature,
  checkRateLimit,
  recordFailedLoginAttempt,
  resetRateLimit,
  logSecurityEvent,
} from '../utils/security';

interface AuthState {
  user: User | null;
  token: string | null;
  currentRole: { role: string } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  handleOAuthSession: (sessionUser: any) => Promise<User>;
  logout: () => Promise<void>;
  hasRole: (...roles: string[]) => boolean;
  hasPermission: (module: string, action?: 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canApprove' | 'canExport') => boolean;
}

const DEFAULT_ROLES: Record<string, Role> = {
  OWNER: { id: 'r-1', name: 'OWNER', displayName: 'Factory Owner' },
  ADMIN: { id: 'r-2', name: 'ADMIN', displayName: 'Administrator' },
  MANAGER: { id: 'r-3', name: 'MANAGER', displayName: 'General Manager' },
  PRODUCTION_MANAGER: { id: 'r-4', name: 'PRODUCTION_MANAGER', displayName: 'Production Manager' },
  INVENTORY_MANAGER: { id: 'r-5', name: 'INVENTORY_MANAGER', displayName: 'Inventory Manager' },
  ACCOUNTANT: { id: 'r-6', name: 'ACCOUNTANT', displayName: 'Accountant' },
  STAFF: { id: 'r-7', name: 'STAFF', displayName: 'Floor Operator' },
};

const MASTER_OWNER_EMAIL = 'kavyakhandelwal57@gmail.com';

export const useAuthStore = create<AuthState>((set, get) => {
  const storedUserJson = localStorage.getItem('factory_user');
  let initialUser: User | null = null;
  if (storedUserJson) {
    try {
      initialUser = JSON.parse(storedUserJson);
    } catch {
      initialUser = null;
    }
  }

  return {
    user: initialUser,
    token: localStorage.getItem('factory_auth_token') || (initialUser ? 'factory-auth-token' : null),
    currentRole: initialUser ? { role: initialUser.role?.name || 'STAFF' } : { role: 'OWNER' },
    isAuthenticated: !!initialUser,
    isLoading: false,

    login: async (email: string, password?: string) => {
      set({ isLoading: true });
      const cleanEmail = email.trim().toLowerCase();

      try {
        // 1. Check Brute Force Protection / Rate Limiting
        const rateLimitStatus = checkRateLimit(cleanEmail, 5, 15 * 60 * 1000);
        if (!rateLimitStatus.allowed) {
          const waitMins = Math.ceil(rateLimitStatus.retryAfterSeconds / 60);
          logSecurityEvent({
            id: crypto.randomUUID(),
            type: 'RATE_LIMIT_LOCKOUT',
            details: `Brute force attempt on account ${cleanEmail}. Blocked for ${waitMins} minutes.`,
            timestamp: new Date().toISOString(),
          });
          throw new Error(
            `Security Lockout: Too many failed login attempts. Please wait ${waitMins} minute(s) before trying again.`
          );
        }

        // 2. Master Factory Owner Verification using Cryptographic SHA-256 Hash
        if (cleanEmail === MASTER_OWNER_EMAIL.toLowerCase()) {
          const isValidPass = password ? await verifyOwnerPassword(password) : false;
          if (!isValidPass) {
            const fail = recordFailedLoginAttempt(cleanEmail, 5, 15 * 60 * 1000);
            logSecurityEvent({
              id: crypto.randomUUID(),
              type: 'LOGIN_FAILED',
              details: `Invalid password attempt for Factory Owner account.`,
              timestamp: new Date().toISOString(),
            });
            if (fail.locked) {
              throw new Error('Security Lockout: Account locked for 15 minutes due to multiple failed attempts.');
            }
            throw new Error('Incorrect password for Factory Owner account.');
          }

          // Reset rate limit on success
          resetRateLimit(cleanEmail);

          const ownerUser: User = {
            id: 'u-owner-kavya',
            email: MASTER_OWNER_EMAIL,
            name: 'Kavya Khandelwal (Owner)',
            phone: '+91 98200 11223',
            role: DEFAULT_ROLES.OWNER,
          };

          const signature = await generateSecuritySignature(ownerUser as unknown as Record<string, unknown>);
          localStorage.setItem('factory_user', JSON.stringify(ownerUser));
          localStorage.setItem('factory_user_sig', signature);
          localStorage.setItem('factory_auth_token', `jwt_session_owner_${Date.now()}`);

          logSecurityEvent({
            id: crypto.randomUUID(),
            type: 'LOGIN_SUCCESS',
            details: `Owner ${cleanEmail} authenticated successfully.`,
            timestamp: new Date().toISOString(),
          });

          set({ user: ownerUser, token: `jwt_session_owner_${Date.now()}`, isAuthenticated: true, isLoading: false, currentRole: { role: 'OWNER' } });
          return;
        }

        // 3. Custom Registered Factory User Verification
        const localCustomUsers = JSON.parse(localStorage.getItem('factory_custom_users') || '[]');
        const matched = localCustomUsers.find((u: any) => u.email.toLowerCase() === cleanEmail);

        if (matched) {
          let passMatches = false;
          if (password) {
            const hashedInput = await sha256Hash(password);
            passMatches = matched.password === password || matched.passwordHash === hashedInput;
          }

          if (!passMatches) {
            const fail = recordFailedLoginAttempt(cleanEmail, 5, 15 * 60 * 1000);
            logSecurityEvent({
              id: crypto.randomUUID(),
              type: 'LOGIN_FAILED',
              details: `Invalid password for custom user ${cleanEmail}.`,
              timestamp: new Date().toISOString(),
            });
            if (fail.locked) {
              throw new Error('Security Lockout: Account locked for 15 minutes due to multiple failed attempts.');
            }
            throw new Error('Invalid password.');
          }

          resetRateLimit(cleanEmail);

          const customRoleTitle = matched.roleDisplayName || matched.roleTitle || matched.roleName || matched.roleId || 'Custom Staff';
          const customModules = matched.allowedModules && Array.isArray(matched.allowedModules) && matched.allowedModules.length > 0
            ? matched.allowedModules
            : ['DASHBOARD', 'PRODUCTION', 'PRODUCTS', 'SETS_SIZES'];

          const customRole: Role = {
            id: matched.roleId || `r-${matched.id}`,
            name: matched.roleName || customRoleTitle.toUpperCase().replace(/\s+/g, '_'),
            displayName: customRoleTitle,
            allowedModules: customModules,
            permissions: customModules.map((m: string) => ({
              module: m,
              canView: true,
              canCreate: true,
              canEdit: true,
              canDelete: true,
              canApprove: true,
              canExport: true,
            })),
          };

          const customUser: User = {
            id: matched.id,
            email: matched.email,
            name: matched.name,
            phone: matched.phone,
            role: customRole,
            allowedModules: customModules,
          };

          const signature = await generateSecuritySignature(customUser as unknown as Record<string, unknown>);
          localStorage.setItem('factory_user', JSON.stringify(customUser));
          localStorage.setItem('factory_user_sig', signature);
          localStorage.setItem('factory_auth_token', `jwt_session_${matched.id}`);

          logSecurityEvent({
            id: crypto.randomUUID(),
            type: 'LOGIN_SUCCESS',
            details: `User ${cleanEmail} authenticated successfully as ${customRole.displayName}.`,
            timestamp: new Date().toISOString(),
          });

          set({ user: customUser, token: `jwt_session_${matched.id}`, isAuthenticated: true, isLoading: false, currentRole: { role: customRole.name } });
          return;
        }

        // If user not found
        recordFailedLoginAttempt(cleanEmail, 5, 15 * 60 * 1000);
        logSecurityEvent({
          id: crypto.randomUUID(),
          type: 'LOGIN_FAILED',
          details: `Attempt to login non-existent account: ${cleanEmail}`,
          timestamp: new Date().toISOString(),
        });
        throw new Error('Account not found. Please verify your registered email address.');
      } catch (err) {
        set({ isLoading: false });
        throw err;
      }
    },

    loginWithGoogle: async () => {
      set({ isLoading: true });
      try {
        if (!isSupabaseConfigured) {
          throw new Error('Supabase is not configured. Please check your environment variables.');
        }

        const redirectTo = `${window.location.origin}/login`;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (error) {
          throw new Error(error.message || 'Google OAuth failed.');
        }
      } catch (err) {
        set({ isLoading: false });
        throw err;
      }
    },

    handleOAuthSession: async (sessionUser: any) => {
      const email = sessionUser.email?.toLowerCase() || '';
      const name = sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || email.split('@')[0] || 'Factory User';
      const isOwner = email === MASTER_OWNER_EMAIL.toLowerCase();

      let assignedRole = isOwner ? DEFAULT_ROLES.OWNER : DEFAULT_ROLES.STAFF;
      let allowedModules: string[] = ['ALL'];

      if (!isOwner) {
        const localCustomUsers = JSON.parse(localStorage.getItem('factory_custom_users') || '[]');
        const matched = localCustomUsers.find((u: any) => u.email.toLowerCase() === email);
        if (matched) {
          const customTitle = matched.roleDisplayName || matched.roleTitle || matched.roleName || 'Factory Operator';
          allowedModules = matched.allowedModules || ['DASHBOARD', 'PRODUCTION', 'PRODUCTS', 'SETS_SIZES'];
          assignedRole = {
            id: matched.roleId || `r-${matched.id}`,
            name: matched.roleName || customTitle.toUpperCase().replace(/\s+/g, '_'),
            displayName: customTitle,
            allowedModules,
          };
        }
      }

      const userObj: User = {
        id: sessionUser.id || `u-google-${Date.now()}`,
        email: sessionUser.email,
        name: isOwner ? 'Kavya Khandelwal (Owner)' : name,
        avatar: sessionUser.user_metadata?.avatar_url,
        phone: sessionUser.phone || '+91 98200 11223',
        role: assignedRole,
        allowedModules,
      };

      const signature = await generateSecuritySignature(userObj as unknown as Record<string, unknown>);
      localStorage.setItem('factory_user', JSON.stringify(userObj));
      localStorage.setItem('factory_user_sig', signature);
      localStorage.setItem('factory_auth_token', `jwt_google_${sessionUser.id}`);

      logSecurityEvent({
        id: crypto.randomUUID(),
        type: 'LOGIN_SUCCESS',
        details: `Google OAuth login success for ${userObj.email}`,
        timestamp: new Date().toISOString(),
      });

      set({
        user: userObj,
        token: `jwt_google_${sessionUser.id}`,
        isAuthenticated: true,
        isLoading: false,
        currentRole: { role: assignedRole.name },
      });

      return userObj;
    },

    logout: async () => {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem('factory_auth_token');
      localStorage.removeItem('factory_user');
      localStorage.removeItem('factory_user_sig');
      set({ token: null, user: null, isAuthenticated: false });
    },

    hasRole: (...roles: string[]) => {
      const user = get().user;
      if (!user) return false;
      if (user.role.name === 'OWNER' || user.email.toLowerCase() === MASTER_OWNER_EMAIL.toLowerCase()) return true;

      // Check if user has management permissions if checking management roles
      const isMgmtCheck = roles.some((r) => ['OWNER', 'ADMIN', 'MANAGER'].includes(r.toUpperCase()));
      if (isMgmtCheck) {
        const userModules = (user.role.allowedModules || user.allowedModules || []).map((m) => m.toUpperCase());
        if (userModules.includes('ALL') || userModules.includes('SETTINGS')) {
          return true;
        }
      }

      return roles.some((r) => 
        r.toUpperCase() === user.role.name.toUpperCase() || 
        r.toLowerCase() === user.role.displayName.toLowerCase()
      );
    },

    hasPermission: (module: string, action = 'canView') => {
      const user = get().user;
      if (!user) return false;

      // Master Owner has unrestricted access to every feature
      if (user.role.name === 'OWNER' || user.email.toLowerCase() === MASTER_OWNER_EMAIL.toLowerCase()) {
        return true;
      }

      const mod = module.toUpperCase();
      const userModules = (user.role.allowedModules || user.allowedModules || []).map((m) => m.toUpperCase());

      // If owner gave full factory access
      if (userModules.includes('ALL')) return true;

      // If explicit module is granted by owner
      if (userModules.includes(mod)) return true;

      // Dashboard & Notifications are accessible if user has at least one assigned module
      if ((mod === 'DASHBOARD' || mod === 'NOTIFICATIONS') && userModules.length > 0) return true;

      // Detailed permission checks
      if (user.role.permissions && user.role.permissions.length > 0) {
        const perm = user.role.permissions.find((p) => p.module.toUpperCase() === mod);
        if (perm) {
          if (action === 'canView') return perm.canView;
          if (action === 'canCreate') return perm.canCreate ?? perm.canView;
          if (action === 'canEdit') return perm.canEdit ?? perm.canView;
          if (action === 'canDelete') return perm.canDelete ?? perm.canView;
          if (action === 'canApprove') return perm.canApprove ?? perm.canView;
          if (action === 'canExport') return perm.canExport ?? perm.canView;
        }
      }

      // Legacy role fallbacks
      if (user.role.name === 'ADMIN' || user.role.name === 'MANAGER') return true;
      if (user.role.name === 'PRODUCTION_MANAGER') {
        return ['DASHBOARD', 'PRODUCTION', 'ORDERS', 'INVENTORY', 'PRODUCTS', 'SETS_SIZES', 'REPORTS', 'AI_MANAGER'].includes(mod);
      }
      if (user.role.name === 'INVENTORY_MANAGER') {
        return ['DASHBOARD', 'INVENTORY', 'PURCHASES', 'DISPATCH', 'PRODUCTS', 'SETS_SIZES', 'REPORTS', 'AI_MANAGER'].includes(mod);
      }
      if (user.role.name === 'ACCOUNTANT') {
        return ['DASHBOARD', 'ORDERS', 'PURCHASES', 'PAYMENTS', 'EXPENSES', 'PRODUCTS', 'SETS_SIZES', 'REPORTS'].includes(mod);
      }
      if (user.role.name === 'STAFF') {
        return ['DASHBOARD', 'PRODUCTION', 'INVENTORY', 'PRODUCTS', 'SETS_SIZES'].includes(mod);
      }

      return false;
    },
  };
});

