import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useSubscription(userId?: string) {
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!userId) {
      setHasActiveSubscription(false);
      setCheckedUserId(null);
      return;
    }

    const check = async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (!isMounted) return;
      setHasActiveSubscription(!!data);
      setCheckedUserId(userId);
    };

    check();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { hasActiveSubscription, loading: !!userId && checkedUserId !== userId };
}
