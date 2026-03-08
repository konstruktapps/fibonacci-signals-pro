import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useSubscription() {
  const { user } = useAuth();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setHasActiveSubscription(false);
      setLoading(false);
      return;
    }

    const check = async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      setHasActiveSubscription(!!data);
      setLoading(false);
    };

    check();
  }, [user]);

  return { hasActiveSubscription, loading };
}
