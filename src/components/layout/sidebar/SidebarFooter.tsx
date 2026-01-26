import { Link } from 'react-router-dom';
import { Shield, Users, LogOut } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface SidebarFooterProps {
  user?: User | null;
  role?: string | null;
  isAdmin?: boolean;
  isAnalyst?: boolean;
  onSignOut?: () => void;
}

export function SidebarFooter({ user, role, isAdmin, isAnalyst, onSignOut }: SidebarFooterProps) {
  return (
    <div className="p-4 border-t border-sidebar-border bg-sidebar-background z-10 space-y-3">
      {/* Role-based navigation */}
      {(isAnalyst || isAdmin) && (
        <div className="flex gap-2">
          {isAnalyst && (
            <Link
              to="/analyst"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold transition-colors border border-teal-200/50"
            >
              <Users className="w-3.5 h-3.5" />
              Analyst
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold transition-colors border border-sky-200/50"
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </Link>
          )}
        </div>
      )}

      {/* User Profile */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
            {user?.email?.substring(0, 2).toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-[10px] font-black text-sidebar-foreground uppercase truncate max-w-[120px]">
              {user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
              {role || 'Viewer'} Access
            </p>
          </div>
        </div>
        {onSignOut && (
          <button
            onClick={onSignOut}
            className="w-8 h-8 rounded-lg bg-muted/50 hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
