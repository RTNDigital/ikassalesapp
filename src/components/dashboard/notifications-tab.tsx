'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiRequests } from '@/lib/api-requests';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { NotificationForm } from './notification-form';
import { NotificationTable, type NotificationEntry } from './notification-table';

export function NotificationsTab({ token }: { token: string }) {
  const [entries, setEntries] = useState<NotificationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{ synced: number; error?: string } | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await ApiRequests.notifications.list(token);
      if (res.status === 200 && res.data?.data?.notifications) {
        setEntries(res.data.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await ApiRequests.orders.sync(token);
      if (res.status === 200 && res.data?.data) {
        const data = res.data.data;
        setLastSyncAt(new Date().toLocaleString('tr-TR'));
        setSyncResult({ synced: data.synced, error: data.error });
        await fetchEntries();
      }
    } catch (error) {
      console.error('Error syncing orders:', error);
      setSyncResult({ synced: 0, error: 'Senkronizasyon sırasında bir hata oluştu.' });
    } finally {
      setSyncing(false);
    }
  };

  const handleTogglePriority = async (id: string, value: boolean) => {
    // Optimistic update
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, isPrioritized: value } : e)));
    try {
      await ApiRequests.notifications.update(token, id, { isPrioritized: value });
    } catch (error) {
      console.error('Error updating priority:', error);
      // Revert on failure
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, isPrioritized: !value } : e)));
    }
  };

  const handleToggleActive = async (id: string, value: boolean) => {
    // Optimistic update
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, isActive: value } : e)));
    try {
      await ApiRequests.notifications.update(token, id, { isActive: value });
    } catch (error) {
      console.error('Error updating active status:', error);
      // Revert on failure
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, isActive: !value } : e)));
    }
  };

  const handleDelete = async (id: string) => {
    const previous = entries;
    // Optimistic update
    setEntries((prev) => prev.filter((e) => e.id !== id));
    try {
      await ApiRequests.notifications.remove(token, id);
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Revert on failure
      setEntries(previous);
    }
  };

  const handleCreated = () => {
    fetchEntries();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top row: Form + Sync controls */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Manual notification form */}
        <NotificationForm token={token} onCreated={handleCreated} />

        {/* Right: Sync controls */}
        <Card>
          <CardHeader>
            <CardTitle>Sipariş Senkronizasyonu</CardTitle>
            <CardDescription>
              Gerçek siparişlerinizi ikas&apos;tan çekerek bildirim verisi oluşturun.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleSync} disabled={syncing} className="w-full">
              {syncing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              {syncing ? 'Senkronize ediliyor...' : 'Siparişleri Senkronize Et'}
            </Button>

            {syncResult && !syncResult.error && syncResult.synced > 0 && (
              <p className="text-sm text-green-600">
                {syncResult.synced} bildirim başarıyla senkronize edildi.
              </p>
            )}

            {syncResult?.error && (
              <p className="text-sm text-red-600">{syncResult.error}</p>
            )}

            {lastSyncAt && (
              <p className="text-xs text-muted-foreground">
                Son senkronizasyon: {lastSyncAt}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              Bu işlem mevcut sipariş verilerini günceller ve ikas&apos;tan güncel siparişleri çeker.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom: Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bildirim Verileri</CardTitle>
          <CardDescription>
            Toplam {entries.length} bildirim verisi bulundu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationTable
            entries={entries}
            onTogglePriority={handleTogglePriority}
            onToggleActive={handleToggleActive}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
    </div>
  );
}
