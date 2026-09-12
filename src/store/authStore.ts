import { create } from 'zustand';
import { User, Role } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabase/client';

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
const MASTER_OWNER_PASSWORDS = ['Kavya@2005', 'asa'];

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
      try {
        const cleanEmail = email.trim().toLowerCase();

        // 1. Master Factory Owner Verification
        if (cleanEmail === MASTER_OWNER_EMAIL.toLowerCase()) {
          if (password && !MASTER_OWNER_PASSWORDS.includes(password)) {
            throw new Error('Incorrect password for Factory Owner account.');
          }

          const ownerUser: User = {
            id: 'u-owner-kavya',
            email: MASTER_OWNER_EMAIL,
            name: 'Kavya Khandelwal (Owner)',
            phone: '+91 98200 11223',
            role: DEFAULT_ROLES.OWNER,
          };

          localStorage.setItem('factory_user', JSON.stringify(ownerUser));
          localStorage.setItem('factory_auth_token', 'jwt_session_owner_kavya');
          set({ user: ownerUser, token: 'jwt_session_owner_kavya', isAuthenticated: true, isLoading: false });
          return;
        }

        // 2. Custom Registered Factory User Verification
        const localCustomUsers = JSON.parse(localStorage.getItem('factory_custom_users') || '[]');
        const matched = localCustomUsers.find((u: any) => u.email.toLowerCase() === cleanEmail);

        if (matched) {
          if (password && matched.password && matched.password !== password) {
            throw new Error('Invalid password.');
          }

          const matchedRole = DEFAULT_ROLES[matched.roleId] || DEFAULT_ROLES.STAFF;
          const customUser: User = {
            id: matched.id,
            email: matched.email,
            name: matched.name,
            phone: matched.phone,
            role: matchedRole,
          };

          localStorage.setItem('factory_user', JSON.stringify(customUser));
          localStorage.setItem('factory_auth_token', `jwt_session_${matched.id}`);
          set({ user: customUser, token: `jwt_session_${matched.id}`, isAuthenticated: true, isLoading: false });
          return;
        }

        // If not found
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
      if (!isOwner) {
        const localCustomUsers = JSON.parse(localStorage.getItem('factory_custom_users') || '[]');
        const matched = localCustomUsers.find((u: any) => u.email.toLowerCase() === email);
        if (matched && matched.roleId) {
          assignedRole = DEFAULT_ROLES[matched.roleId] || DEFAULT_ROLES.STAFF;
        }
      }

      const userObj: User = {
        id: sessionUser.id || `u-google-${Date.now()}`,
        email: sessionUser.email,
        name: isOwner ? 'Kavya Khandelwal (Owner)' : name,
        avatar: sessionUser.user_metadata?.avatar_url,
        phone: sessionUser.phone || '+91 98200 11223',
        role: assignedRole,
      };

      localStorage.setItem('factory_user', JSON.stringify(userObj));
      localStorage.setItem('factory_auth_token', `jwt_google_${sessionUser.id}`);
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
      set({ token: null, user: null, isAuthenticated: false });
    },

    hasRole: (...roles: string[]) => {
      const user = get().user;
      if (!user) return false;
      if (user.role.name === 'OWNER') return true;
      return roles.includes(user.role.name);
    },

    hasPermission: (module: string, action = 'canView') => {
      const user = get().user;
      if (!user) return false;
      if (user.role.name === 'OWNER' || user.role.name === 'ADMIN') return true;
      if (user.role.name === 'MANAGER') return true;

      if (user.role.name === 'PRODUCTION_MANAGER') {
        return ['DASHBOARD', 'PRODUCTION', 'ORDERS', 'INVENTORY', 'PRODUCTS', 'SETS_SIZES', 'REPORTS', 'AI_MANAGER'].includes(module.toUpperCase());
      }
      if (user.role.name === 'INVENTORY_MANAGER') {
        return ['DASHBOARD', 'INVENTORY', 'PURCHASES', 'DISPATCH', 'PRODUCTS', 'SETS_SIZES', 'REPORTS', 'AI_MANAGER'].includes(module.toUpperCase());
      }
      if (user.role.name === 'ACCOUNTANT') {
        return ['DASHBOARD', 'ORDERS', 'PURCHASES', 'PAYMENTS', 'EXPENSES', 'PRODUCTS', 'SETS_SIZES', 'REPORTS'].includes(module.toUpperCase());
      }
      if (user.role.name === 'STAFF') {
        return ['DASHBOARD', 'PRODUCTION', 'INVENTORY', 'PRODUCTS', 'SETS_SIZES'].includes(module.toUpperCase());
      }

      return false;
    },
  };
});
