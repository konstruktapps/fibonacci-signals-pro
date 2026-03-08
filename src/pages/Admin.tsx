import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, CreditCard, Users, LogOut, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import PlansManager from '@/components/admin/PlansManager';
import SubscribersTable from '@/components/admin/SubscribersTable';
import AdminMetrics from '@/components/admin/AdminMetrics';

const Admin = () => {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-1.5 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground font-display">Painel Administrativo</h1>
            <p className="text-xs text-muted-foreground">Gerencie planos e assinantes</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="p-1.5 rounded bg-secondary text-secondary-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
          title="Sair"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <AdminMetrics />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-6"
      >
        <Tabs defaultValue="plans">
          <TabsList className="bg-secondary">
            <TabsTrigger value="plans" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <CreditCard className="w-3.5 h-3.5" />
              Planos
            </TabsTrigger>
            <TabsTrigger value="subscribers" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="w-3.5 h-3.5" />
              Assinantes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="mt-4">
            <PlansManager />
          </TabsContent>
          <TabsContent value="subscribers" className="mt-4">
            <SubscribersTable />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default Admin;
