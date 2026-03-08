import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  interval: string;
  is_active: boolean;
  created_at: string;
}

const INTERVALS: Record<string, string> = {
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
  annual: 'Anual',
};

const PlansManager = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', interval: 'monthly' });

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setPlans(data);
    setLoading(false);
  };

  useEffect(() => { fetchPlans(); }, []);

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', interval: 'monthly' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (plan: Plan) => {
    setForm({
      name: plan.name,
      description: plan.description || '',
      price: (plan.price_cents / 100).toFixed(2),
      interval: plan.interval,
    });
    setEditingId(plan.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast.error('Preencha nome e preço');
      return;
    }

    const priceCents = Math.round(parseFloat(form.price.replace(',', '.')) * 100);
    if (isNaN(priceCents) || priceCents <= 0) {
      toast.error('Preço inválido');
      return;
    }

    const payload = {
      name: form.name,
      description: form.description || null,
      price_cents: priceCents,
      interval: form.interval,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error } = await supabase.from('plans').update(payload).eq('id', editingId);
      if (error) { toast.error('Erro ao atualizar plano'); return; }
      toast.success('Plano atualizado');
    } else {
      const { error } = await supabase.from('plans').insert(payload);
      if (error) { toast.error('Erro ao criar plano'); return; }
      toast.success('Plano criado');
    }

    resetForm();
    fetchPlans();
  };

  const handleToggle = async (plan: Plan) => {
    const { error } = await supabase
      .from('plans')
      .update({ is_active: !plan.is_active, updated_at: new Date().toISOString() })
      .eq('id', plan.id);
    if (error) { toast.error('Erro ao alterar status'); return; }
    toast.success(plan.is_active ? 'Plano desativado' : 'Plano ativado');
    fetchPlans();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este plano?')) return;
    const { error } = await supabase.from('plans').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir plano'); return; }
    toast.success('Plano excluído');
    fetchPlans();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-foreground">Planos de Assinatura</h3>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Novo Plano
          </Button>
        )}
      </div>

      {showForm && (
        <div className="glass rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Plano Pro"
              />
            </div>
            <div>
              <Label className="text-xs">Preço (R$)</Label>
              <Input
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="49.90"
              />
            </div>
            <div>
              <Label className="text-xs">Descrição</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descrição opcional"
              />
            </div>
            <div>
              <Label className="text-xs">Período</Label>
              <select
                value={form.interval}
                onChange={(e) => setForm({ ...form, interval: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {Object.entries(INTERVALS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} className="gap-1.5">
              <Check className="w-3.5 h-3.5" /> {editingId ? 'Atualizar' : 'Criar'}
            </Button>
            <Button size="sm" variant="ghost" onClick={resetForm} className="gap-1.5">
              <X className="w-3.5 h-3.5" /> Cancelar
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm text-center py-8">Carregando planos...</p>
      ) : plans.length === 0 ? (
        <div className="glass rounded-lg p-8 text-center">
          <p className="text-muted-foreground text-sm">Nenhum plano cadastrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`glass rounded-lg p-4 transition-opacity ${!plan.is_active ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-display text-sm font-semibold text-foreground">{plan.name}</h4>
                  {plan.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                  )}
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-display ${
                    plan.is_active
                      ? 'bg-success/10 text-success'
                      : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  {plan.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <p className="text-xl font-bold font-display text-foreground">
                R$ {(plan.price_cents / 100).toFixed(2)}
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  /{INTERVALS[plan.interval]?.toLowerCase()}
                </span>
              </p>
              <div className="flex gap-1.5 mt-3">
                <Button size="sm" variant="ghost" onClick={() => handleEdit(plan)} className="h-7 px-2">
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleToggle(plan)} className="h-7 px-2 text-xs">
                  {plan.is_active ? 'Desativar' : 'Ativar'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(plan.id)}
                  className="h-7 px-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlansManager;
