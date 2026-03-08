import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Check, CreditCard, LogOut, RefreshCw, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { z } from 'zod';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  interval: string;
}

const INTERVALS: Record<string, string> = {
  monthly: 'mês',
  quarterly: 'trimestre',
  semiannual: 'semestre',
  annual: 'ano',
};

const cpfSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v.length === 11 || v.length === 14, {
    message: 'CPF deve ter 11 dígitos ou CNPJ 14 dígitos',
  });

const nameSchema = z
  .string()
  .trim()
  .min(3, 'Nome deve ter ao menos 3 caracteres')
  .max(100, 'Nome muito longo');

const formatCpf = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

const Checkout = () => {
  const { user, session, signOut } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase
        .from('plans')
        .select('id, name, description, price_cents, interval')
        .eq('is_active', true)
        .order('price_cents', { ascending: true });

      if (data) setPlans(data);
      setLoading(false);
    };
    fetchPlans();
  }, []);

  const handleSubmit = async () => {
    if (!selectedPlanId) {
      toast.error('Selecione um plano');
      return;
    }

    const nameResult = nameSchema.safeParse(name);
    if (!nameResult.success) {
      toast.error(nameResult.error.errors[0].message);
      return;
    }

    const cpfResult = cpfSchema.safeParse(cpf);
    if (!cpfResult.success) {
      toast.error(cpfResult.error.errors[0].message);
      return;
    }

    setSubmitting(true);

    try {
      const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
      const token = session?.access_token;

      // 1. Create customer in Asaas
      const custResponse = await fetch(`${baseUrl}/asaas-api?action=create-customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          name: nameResult.data,
          email: user?.email,
          cpfCnpj: cpfResult.data,
          phone: phone.replace(/\D/g, '') || undefined,
        }),
      });

      const custData = await custResponse.json();
      if (!custResponse.ok) throw new Error(custData.error || 'Erro ao criar cliente');

      // 2. Create subscription
      const subResponse = await fetch(`${baseUrl}/asaas-api?action=create-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: custData.customer.id,
          planId: selectedPlanId,
        }),
      });

      const subData = await subResponse.json();
      if (!subResponse.ok) throw new Error(subData.error || 'Erro ao criar assinatura');

      setSuccess(true);
      toast.success('Assinatura criada! Você receberá as instruções de pagamento por email.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar checkout');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-xl p-8 max-w-md w-full text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-lg font-bold font-display text-foreground">Assinatura Criada!</h2>
          <p className="text-sm text-muted-foreground">
            Você receberá um email com as instruções de pagamento. Após a confirmação, seu acesso será liberado automaticamente.
          </p>
          <Link to="/">
            <Button className="mt-4">Voltar ao Início</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            to="/"
            className="p-1.5 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground font-display">Escolha seu Plano</h1>
            <p className="text-xs text-muted-foreground">Acesso completo ao Fibonacci Analyzer</p>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="ml-auto gap-1 text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>

        {/* Plans */}
        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : plans.length === 0 ? (
          <div className="glass rounded-lg p-8 text-center">
            <p className="text-muted-foreground text-sm">Nenhum plano disponível no momento.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {plans.map((plan, i) => {
                const isSelected = selectedPlanId === plan.id;
                const isFeatured = i === 1 && plans.length > 1;
                return (
                  <motion.button
                    key={plan.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative glass rounded-xl p-5 text-left transition-all ${
                      isSelected
                        ? 'ring-2 ring-primary glow-primary'
                        : 'hover:border-primary/30'
                    }`}
                  >
                    {isFeatured && (
                      <span className="absolute -top-2.5 left-4 bg-accent text-accent-foreground text-[10px] font-display font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Popular
                      </span>
                    )}
                    <h3 className="font-display text-sm font-semibold text-foreground mb-1">
                      {plan.name}
                    </h3>
                    {plan.description && (
                      <p className="text-xs text-muted-foreground mb-3">{plan.description}</p>
                    )}
                    <p className="text-2xl font-bold font-display text-foreground">
                      R$ {(plan.price_cents / 100).toFixed(2)}
                      <span className="text-xs text-muted-foreground font-normal ml-1">
                        /{INTERVALS[plan.interval] || plan.interval}
                      </span>
                    </p>
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-xl p-6 space-y-4"
            >
              <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                Dados para Cobrança
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Nome Completo</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label className="text-xs">CPF ou CNPJ</Label>
                  <Input
                    value={cpf}
                    onChange={(e) => setCpf(formatCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={18}
                  />
                </div>
                <div>
                  <Label className="text-xs">Telefone (opcional)</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || !selectedPlanId}
                    className="w-full gap-2"
                  >
                    {submitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                    {submitting ? 'Processando...' : 'Assinar Agora'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Checkout;
