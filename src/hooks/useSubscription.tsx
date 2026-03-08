import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useSubscription(userId?: string) {
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (!userId) {
      setHasActiveSubscription(false);
      setLoading(false);
      return;
    }

    const check = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (!isMounted) return;
      setHasActiveSubscription(!!data);
      setLoading(false);
    };

    check();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { hasActiveSubscription, loading };
}
