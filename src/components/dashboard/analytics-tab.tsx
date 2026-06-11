'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiRequests } from '@/lib/api-requests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, MousePointerClick, Percent } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface AnalyticsSummary {
  impressions: number;
  clicks: number;
  ctr: number;
}

interface DailyEntry {
  date: string;
  impressions: number;
  clicks: number;
}

interface TopProduct {
  productName: string;
  clicks: number;
  impressions?: number;
  ctr?: number;
}

interface DeviceBreakdown {
  desktop: number;
  mobile: number;
}

interface AnalyticsData {
  summary: AnalyticsSummary;
  daily: DailyEntry[];
  topProducts: TopProduct[];
  devices: DeviceBreakdown;
}

const TR_SHORT_MONTHS = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
];

function formatDateTR(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()} ${TR_SHORT_MONTHS[d.getMonth()]}`;
}

export function AnalyticsTab({ token }: { token: string }) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState('7');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ApiRequests.analytics.get(token, parseInt(days));
      if (res.status === 200 && res.data?.data) {
        setAnalyticsData(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [token, days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Analitik verileri yüklenemedi.
      </div>
    );
  }

  const summary = analyticsData.summary ?? { impressions: 0, clicks: 0, ctr: 0 };
  const daily = analyticsData.daily ?? [];
  const topProducts = analyticsData.topProducts ?? [];
  const devices = analyticsData.devices ?? { desktop: 0, mobile: 0 };
  const totalDevices = (devices.desktop || 0) + (devices.mobile || 0);
  const desktopPct = totalDevices > 0 ? Math.round(((devices.desktop || 0) / totalDevices) * 100) : 0;
  const mobilePct = totalDevices > 0 ? Math.round(((devices.mobile || 0) / totalDevices) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center gap-3">
        <Label htmlFor="dateRange">Tarih Aralığı</Label>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger id="dateRange" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Son 7 Gün</SelectItem>
            <SelectItem value="30">Son 30 Gün</SelectItem>
            <SelectItem value="365">Tümü</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gösterim</CardTitle>
            <Eye className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(summary.impressions ?? 0).toLocaleString('tr-TR')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tıklama</CardTitle>
            <MousePointerClick className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(summary.clicks ?? 0).toLocaleString('tr-TR')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">CTR</CardTitle>
            <Percent className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">%{summary.ctr.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Günlük Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {daily.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              Henüz veri yok
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateTR}
                  fontSize={12}
                />
                <YAxis fontSize={12} />
                <Tooltip
                  labelFormatter={(label) => formatDateTR(String(label))}
                  formatter={(value, name) => [
                    Number(value).toLocaleString('tr-TR'),
                    name === 'impressions' ? 'Gösterim' : 'Tıklama',
                  ]}
                />
                <Legend
                  formatter={(value: string) =>
                    value === 'impressions' ? 'Gösterim' : 'Tıklama'
                  }
                />
                <Line
                  type="monotone"
                  dataKey="impressions"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>En İyi Ürünler</CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">Henüz veri yok</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Ürün</th>
                    <th className="pb-2 text-right font-medium">Tıklama</th>
                    <th className="pb-2 text-right font-medium">Gösterim</th>
                    <th className="pb-2 text-right font-medium">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((product, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-2">{product.productName}</td>
                      <td className="py-2 text-right">{(product.clicks ?? 0).toLocaleString('tr-TR')}</td>
                      <td className="py-2 text-right">{(product.impressions ?? 0).toLocaleString('tr-TR')}</td>
                      <td className="py-2 text-right">%{(product.ctr ?? 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Device Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Cihaz Dağılımı</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Masaüstü</span>
              <span className="font-medium">%{desktopPct}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${desktopPct}%` }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Mobil</span>
              <span className="font-medium">%{mobilePct}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-rose-500 transition-all"
                style={{ width: `${mobilePct}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
