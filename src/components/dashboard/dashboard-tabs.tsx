'use client';

import { useCallback, useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { ApiRequests } from '@/lib/api-requests';
import { SettingsTab } from './settings-tab';
import { NotificationsTab } from './notifications-tab';
import { AnalyticsTab } from './analytics-tab';

interface DashboardTabsProps {
  token: string;
}

export function DashboardTabs({ token }: DashboardTabsProps) {
  const [reauthStoreName, setReauthStoreName] = useState<string | null>(null);

  const checkScope = useCallback(async () => {
    try {
      const res = await ApiRequests.scope.check(token);
      const data = res.data?.data;
      if (data?.needsReauth && data.storeName) {
        setReauthStoreName(data.storeName);
      }
    } catch {
      // Scope check failed silently — don't block dashboard
    }
  }, [token]);

  useEffect(() => {
    checkScope();
  }, [checkScope]);

  const handleReauth = () => {
    const authorizeUrl = `/api/oauth/authorize/ikas?storeName=${encodeURIComponent(reauthStoreName!)}`;
    if (window.top) {
      window.top.location.href = authorizeUrl;
    } else {
      window.location.href = authorizeUrl;
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] p-6">
      {reauthStoreName && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="size-4" />
          <AlertTitle>Yetkilendirme Güncellenmeli</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Widget&apos;ın mağazanızda çalışması için ek izinler gerekiyor. Lütfen yeniden yetkilendirin.</span>
            <Button variant="outline" size="sm" onClick={handleReauth} className="ml-4 shrink-0">
              <ExternalLink className="size-4" />
              Yetkilendirmeyi Güncelle
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Ayarlar</TabsTrigger>
          <TabsTrigger value="notifications">Bildirim Verileri</TabsTrigger>
          <TabsTrigger value="analytics">Analitik</TabsTrigger>
        </TabsList>
        <TabsContent value="settings">
          <SettingsTab token={token} />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTab token={token} />
        </TabsContent>
        <TabsContent value="analytics">
          <AnalyticsTab token={token} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
