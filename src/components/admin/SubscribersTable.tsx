import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Subscription {
  id: string;
  user_id: string;
  status: string;
  started_at: string | null;
  expires_at: string | null;
  created_at: string;
  plan: { name: string; price_cents: number } | null;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  active: { label: 'Ativo', className: 'bg-success/10 text-success' },
  pending: { label: 'Pendente', className: 'bg-warning/10 text-warning' },
  overdue: { label: 'Inadimplente', className: 'bg-destructive/10 text-destructive' },
  cancelled: { label: 'Cancelado', className: 'bg-muted text-muted-foreground' },
  expired: { label: 'Expirado', className: 'bg-muted text-muted-foreground' },
};

const SubscribersTable = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, plan:plans(name, price_cents)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setSubscriptions(data.map(s => ({
          ...s,
          plan: Array.isArray(s.plan) ? s.plan[0] || null : s.plan,
        })));
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  if (loading) {
    return <p className="text-muted-foreground text-sm text-center py-8">Carregando assinantes...</p>;
  }

  if (subscriptions.length === 0) {
    return (
      <div className="glass rounded-lg p-8 text-center">
        <p className="text-muted-foreground text-sm">Nenhum assinante encontrado.</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-display text-xs">Usuário</TableHead>
            <TableHead className="font-display text-xs">Plano</TableHead>
            <TableHead className="font-display text-xs">Status</TableHead>
            <TableHead className="font-display text-xs">Início</TableHead>
            <TableHead className="font-display text-xs">Vencimento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.map((sub) => {
            const status = STATUS_LABELS[sub.status] || STATUS_LABELS.pending;
            return (
              <TableRow key={sub.id}>
                <TableCell className="font-mono text-xs">{sub.user_id.slice(0, 8)}...</TableCell>
                <TableCell className="text-sm">{sub.plan?.name || '—'}</TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-display ${status.className}`}>
                    {status.label}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(sub.started_at)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(sub.expires_at)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default SubscribersTable;
