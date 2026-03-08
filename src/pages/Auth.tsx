import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Activity, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const userId = data.user?.id;
        let isAdmin = false;

        if (userId) {
          const { data: adminRole } = await supabase
            .from('user_roles')
            .select('id')
            .eq('user_id', userId)
            .eq('role', 'admin')
            .maybeSingle();

          isAdmin = !!adminRole;
        }

        toast.success('Login realizado com sucesso!');
        navigate(isAdmin ? '/admin' : '/');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/checkout` },
        });
        if (error) throw error;
        if (data.session) {
          toast.success('Cadastro realizado! Complete seu plano.');
          navigate('/checkout');
        } else {
          toast.success('Cadastro realizado! Verifique seu email para confirmar.');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm glass rounded-xl p-8 space-y-6">
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center glow-primary">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-lg font-bold text-foreground font-display">
            Fibonacci Analyzer
          </h1>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Aguarde...' : isLogin ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          {isLogin ? 'Não tem conta?' : 'Já tem conta?'}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline font-medium"
          >
            {isLogin ? 'Cadastre-se' : 'Faça login'}
          </button>
        </p>
      </div>
    </div>
  );
}
