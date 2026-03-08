import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAdmin(userId?: string) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!userId) {
      setIsAdmin(false);
      setCheckedUserId(null);
      return;
    }

    const checkAdmin = async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (!isMounted) return;
      setIsAdmin(!!data && !error);
      setCheckedUserId(userId);
    };

    checkAdmin();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { isAdmin, loading: !!userId && checkedUserId !== userId };
}

