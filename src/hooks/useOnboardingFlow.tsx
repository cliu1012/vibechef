import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useOnboardingFlow = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (authLoading || !user) {
        setChecking(false);
        return;
      }

      // Don't redirect if already on auth, onboarding, or inventory-setup pages
      const exemptPaths = ['/auth', '/onboarding', '/inventory-setup', '/'];
      if (exemptPaths.includes(location.pathname)) {
        setChecking(false);
        return;
      }

      try {
        // Check if user has completed onboarding
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error checking onboarding status:', profileError);
          setChecking(false);
          return;
        }

        // If no profile or onboarding not completed, go to onboarding
        if (!profile || !profile.onboarding_completed) {
          navigate('/onboarding', { replace: true });
          setChecking(false);
          return;
        }

        // Check inventory levels
        const { data: inventory, error: inventoryError } = await supabase
          .from('user_inventory')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (inventoryError) {
          console.error('Error checking inventory:', inventoryError);
          setChecking(false);
          return;
        }

        // If inventory is empty, go to inventory setup
        if (!inventory || inventory.length === 0) {
          navigate('/inventory-setup', { replace: true });
          setChecking(false);
          return;
        }

        setChecking(false);
      } catch (error) {
        console.error('Error in onboarding flow:', error);
        setChecking(false);
      }
    };

    checkOnboardingStatus();
  }, [user, authLoading, navigate, location.pathname]);

  return { checking };
};
