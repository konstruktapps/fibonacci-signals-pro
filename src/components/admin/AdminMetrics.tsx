import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';

interface Metrics {
  totalSubscribers: number;
  activeSubscribers: number;
  totalPlans: number;
  monthlyRevenue: number;
}

const AdminMetrics = () => {
  const [metrics, setMetrics] = useState<Metrics>({
    totalSubscribers: 0,
    activeSubscribers: 0,
    totalPlans: 0,
    monthlyRevenue: 0,
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      const [subsRes, activeSubs, plansRes] = await Promise.all([
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('id, plan_id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('plans').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);

      let monthlyRevenue = 0;
      if (activeSubs.data && activeSubs.data.length > 0) {
        const planIds = [...new Set(activeSubs.data.map(s => s.plan_id))];
        const { data: plans } = await supabase.from('plans').select('id, price_cents').in('id', planIds);
        if (plans) {
          const priceMap = Object.fromEntries(plans.map(p => [p.id, p.price_cents]));
          monthlyRevenue = activeSubs.data.reduce((sum, s) => sum + (priceMap[s.plan_id] || 0), 0);
        }
      }

      setMetrics({
        totalSubscribers: subsRes.count || 0,
        activeSubscribers: activeSubs.count || 0,
        totalPlans: plansRes.count || 0,
        monthlyRevenue,
      });
    };

    fetchMetrics();
  }, []);

  const cards = [
    { label: 'Assinantes Ativos', value: metrics.activeSubscribers, icon: Users, color: 'text-success' },
    { label: 'Total Assinantes', value: metrics.totalSubscribers, icon: Users, color: 'text-primary' },
    { label: 'Planos Ativos', value: metrics.totalPlans, icon: CreditCard, color: 'text-accent' },
    {
      label: 'Receita Mensal',
      value: `R$ ${(metrics.monthlyRevenue / 100).toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-success',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="glass rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">{card.label}</span>
            <card.icon className={`w-4 h-4 ${card.color}`} />
          </div>
          <p className="text-2xl font-bold font-display text-foreground">{card.value}</p>
        </div>
      ))}
    </div>
  );
};

export default AdminMetrics;
