import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { verifySecuritySignature, logSecurityEvent } from '../../utils/security';

interface ProtectedRouteProps {
  children: React.ReactNode;
  module?: string;
  roles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  module,
  roles,
}) => {
  const { isAuthenticated, user, hasPermission, hasRole, logout } = useAuthStore();
  const location = useLocation();
  const [isTampered, setIsTampered] = useState(false);

  // Anti-Tamper Session Integrity Check
  useEffect(() => {
    if (isAuthenticated && user) {
      const storedSig = localStorage.getItem('factory_user_sig');
      if (storedSig) {
        verifySecuritySignature(user as unknown as Record<string, unknown>, storedSig).then((isValid) => {
          if (!isValid) {
            console.error('CRITICAL: Session integrity signature verification failed! LocalStorage was tampered.');
            logSecurityEvent({
              id: crypto.randomUUID(),
              type: 'TAMPER_DETECTED',
              details: `Session payload mismatch for ${user.email}. Terminating session.`,
              timestamp: new Date().toISOString(),
            });
            setIsTampered(true);
            logout();
          }
        });
      }
    }
  }, [isAuthenticated, user, logout]);

  if (isTampered) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 mb-4 animate-bounce">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-rose-400">Security Alert: Session Integrity Violation</h2>
        <p className="text-sm text-slate-400 max-w-md mt-2">
          An unauthorized alteration to local session state or permissions was detected. Your session has been safely terminated.
        </p>
        <div className="mt-6">
          <Button variant="danger" onClick={() => (window.location.href = '/login')}>
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check Role requirement
  if (roles && roles.length > 0 && !hasRole(...roles)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">Access Restricted</h2>
        <p className="text-sm text-slate-400 max-w-md mt-2">
          Your assigned role (<span className="text-rose-400 font-semibold">{user.role.displayName}</span>) does not have permission to access this module.
        </p>
        <div className="mt-6">
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Check Module View Permission
  if (module && !hasPermission(module, 'canView')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">Permission Denied</h2>
        <p className="text-sm text-slate-400 max-w-md mt-2">
          You do not have view permissions for the <strong className="text-slate-200">{module}</strong> module. Please contact the factory administrator.
        </p>
        <div className="mt-6">
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
