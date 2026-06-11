'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SettingsTab } from './settings-tab';
import { NotificationsTab } from './notifications-tab';
import { AnalyticsTab } from './analytics-tab';

interface DashboardTabsProps {
  token: string;
}

export function DashboardTabs({ token }: DashboardTabsProps) {
  return (
    <div className="mx-auto max-w-[1200px] p-6">
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
