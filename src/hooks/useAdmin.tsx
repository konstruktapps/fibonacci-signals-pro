import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAdmin(userId?: string) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (!userId) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const checkAdmin = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (!isMounted) return;
      setIsAdmin(!!data && !error);
      setLoading(false);
    };

    checkAdmin();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { isAdmin, loading };
}

