'use client';

import { useEffect, useState, useCallback } from 'react';
import { TokenHelpers } from '@/helpers/token-helpers';
import { AppBridgeHelper } from '@ikas/app-helpers';
import { DashboardTabs } from '@/components/dashboard/dashboard-tabs';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const [token, setToken] = useState<string | null>(null);

  /**
   * Initializes the dashboard by fetching the token.
   */
  const initializeDashboard = useCallback(async () => {
    try {
      const fetchedToken = await TokenHelpers.getTokenForIframeApp();
      setToken(fetchedToken || null);
    } catch (error) {
      console.error('Error initializing dashboard:', error);
    }
  }, []);

  // Close the loader shown by ikas platform when opening the iframe
  useEffect(() => {
    AppBridgeHelper.closeLoader();
  }, []);

  // Run initialization on mount
  useEffect(() => {
    initializeDashboard();
  }, [initializeDashboard]);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <DashboardTabs token={token} />;
}
