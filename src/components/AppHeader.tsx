import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { NavLink } from '@/components/NavLink';
import { Activity, LayoutDashboard, LineChart, LogOut } from 'lucide-react';

export function AppHeader() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin(user?.id);

  return (
    <header className="h-12 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold font-display text-foreground hidden sm:inline">
            Fibonacci Analyzer
          </span>
        </div>

        <nav className="flex items-center gap-1">
          <NavLink
            to="/"
            end
            className="px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center gap-1.5"
            activeClassName="bg-primary/10 text-primary"
          >
            <LineChart className="w-3.5 h-3.5" />
            Gráficos
          </NavLink>

          {isAdmin && (
            <NavLink
              to="/admin"
              className="px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center gap-1.5"
              activeClassName="bg-primary/10 text-primary"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Painel Admin
            </NavLink>
          )}
        </nav>
      </div>

      <button
        onClick={signOut}
        className="p-1.5 rounded bg-secondary text-secondary-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
        title="Sair"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </header>
  );
}
