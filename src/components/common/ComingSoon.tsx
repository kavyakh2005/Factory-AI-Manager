import React from 'react';
import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';
import { ArrowLeft, Clock, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ComingSoonProps {
  moduleName: string;
  description: string;
  icon: React.ReactNode;
  highlights: string[];
  requiredRole?: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({
  moduleName,
  description,
  icon,
  highlights,
  requiredRole = 'All Authorized Roles',
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/20">
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-100">{moduleName}</h1>
              <Badge variant="warning">Phase 2 Planned</Badge>
            </div>
            <p className="text-sm text-slate-400 mt-1">{description}</p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} icon={<ArrowLeft className="w-4 h-4" />}>
          Back to Dashboard
        </Button>
      </div>

      <Card className="p-8 border-dashed border-slate-700 bg-factory-900/50 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 mb-4">
          <Clock className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-200">Module Foundation Ready</h3>
        <p className="text-sm text-slate-400 max-w-lg mx-auto mt-2">
          The database tables, schema models, and RBAC permissions for <strong className="text-primary-400">{moduleName}</strong> have been created in the database. Full interactive UI and workflow engine will be active in the next phase.
        </p>

        <div className="mt-8 pt-6 border-t border-slate-800 text-left">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Key Architectural Capabilities Included in Phase 2:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {highlights.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-factory-950/60 border border-slate-800">
                <div className="w-2 h-2 rounded-full bg-primary-400 mt-1.5 shrink-0" />
                <span className="text-xs text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Role-Based Access Enforcement: Active</span>
          </div>
          <span className="text-slate-500">Access Scope: {requiredRole}</span>
        </div>
      </Card>
    </div>
  );
};
