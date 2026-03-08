import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Users } from 'lucide-react';
import PlansManager from '@/components/admin/PlansManager';
import SubscribersTable from '@/components/admin/SubscribersTable';
import AdminMetrics from '@/components/admin/AdminMetrics';
import { AppHeader } from '@/components/AppHeader';

const Admin = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="p-4 lg:p-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-lg font-bold text-foreground font-display">Painel Administrativo</h1>
          <p className="text-xs text-muted-foreground">Gerencie planos e assinantes</p>
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
    </div>
  );
};

export default Admin;
