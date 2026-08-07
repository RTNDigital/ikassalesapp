'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiRequests } from '@/lib/api-requests';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle2, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';

interface PageTargeting {
  mode: 'all' | 'selected' | 'excluded';
  rules?: { url: string; matchType: 'contains' | 'exact' | 'startsWith' }[];
}

interface CustomColors {
  background?: string;
  text?: string;
  border?: string;
}

interface SettingsState {
  isActive: boolean;
  showOnMobile: boolean;
  dataMode: string;
  messageTemplate: string;
  timeTemplate: string;
  theme: string;
  position: string;
  animation: string;
  customColors: CustomColors;
  firstDelay: number;
  displayDuration: number;
  delayBetween: number;
  maxPerPage: number;
  showTeaser: boolean;
  teaserText: string;
  teaserBehavior: string;
  pageTargeting: PageTargeting;
}

const DEFAULT_SETTINGS: SettingsState = {
  isActive: true,
  showOnMobile: true,
  dataMode: 'both',
  messageTemplate: '{{name}} satın aldı',
  timeTemplate: '{{time}} önce · {{location}}',
  theme: 'classic',
  position: 'bottom-left',
  animation: 'slide',
  customColors: {},
  firstDelay: 3000,
  displayDuration: 5000,
  delayBetween: 8000,
  maxPerPage: 10,
  showTeaser: false,
  teaserText: 'Son satışlar',
  teaserBehavior: 'after-close',
  pageTargeting: { mode: 'all' },
};

export function SettingsTab({ token }: { token: string }) {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reinjecting, setReinjecting] = useState(false);
  const [reinjectResult, setReinjectResult] = useState<'success' | 'error' | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await ApiRequests.settings.get(token);
      if (res.status === 200 && res.data?.data?.settings) {
        const s = res.data.data.settings;
        setSettings({
          isActive: s.isActive ?? DEFAULT_SETTINGS.isActive,
          showOnMobile: s.showOnMobile ?? DEFAULT_SETTINGS.showOnMobile,
          dataMode: s.dataMode ?? DEFAULT_SETTINGS.dataMode,
          messageTemplate: s.messageTemplate ?? DEFAULT_SETTINGS.messageTemplate,
          timeTemplate: s.timeTemplate ?? DEFAULT_SETTINGS.timeTemplate,
          theme: s.theme ?? DEFAULT_SETTINGS.theme,
          position: s.position ?? DEFAULT_SETTINGS.position,
          animation: s.animation ?? DEFAULT_SETTINGS.animation,
          customColors: parseJSON(s.customColors, DEFAULT_SETTINGS.customColors),
          firstDelay: s.firstDelay ?? DEFAULT_SETTINGS.firstDelay,
          displayDuration: s.displayDuration ?? DEFAULT_SETTINGS.displayDuration,
          delayBetween: s.delayBetween ?? DEFAULT_SETTINGS.delayBetween,
          maxPerPage: s.maxPerPage ?? DEFAULT_SETTINGS.maxPerPage,
          showTeaser: s.showTeaser ?? DEFAULT_SETTINGS.showTeaser,
          teaserText: s.teaserText ?? DEFAULT_SETTINGS.teaserText,
          teaserBehavior: s.teaserBehavior ?? DEFAULT_SETTINGS.teaserBehavior,
          pageTargeting: parseJSON(s.pageTargeting, DEFAULT_SETTINGS.pageTargeting),
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await ApiRequests.settings.update(token, {
        ...settings,
        customColors: settings.customColors,
        pageTargeting: settings.pageTargeting,
      });
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReinjectWidget = async () => {
    setReinjecting(true);
    setReinjectResult(null);
    try {
      const res = await ApiRequests.widget.reinject(token);
      setReinjectResult(res.data?.data?.success ? 'success' : 'error');
    } catch {
      setReinjectResult('error');
    } finally {
      setReinjecting(false);
      setTimeout(() => setReinjectResult(null), 5000);
    }
  };

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateColor = (key: keyof CustomColors, value: string) => {
    setSettings((prev) => ({
      ...prev,
      customColors: { ...prev.customColors, [key]: value },
    }));
  };

  const updatePageTargetingMode = (mode: 'all' | 'selected' | 'excluded') => {
    setSettings((prev) => ({
      ...prev,
      pageTargeting: {
        ...prev.pageTargeting,
        mode,
        rules: mode !== 'all' ? prev.pageTargeting.rules || [] : undefined,
      },
    }));
  };

  const addPageRule = () => {
    setSettings((prev) => ({
      ...prev,
      pageTargeting: {
        ...prev.pageTargeting,
        rules: [...(prev.pageTargeting.rules || []), { url: '', matchType: 'contains' }],
      },
    }));
  };

  const removePageRule = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      pageTargeting: {
        ...prev.pageTargeting,
        rules: (prev.pageTargeting.rules || []).filter((_, i) => i !== index),
      },
    }));
  };

  const updatePageRule = (index: number, field: 'url' | 'matchType', value: string) => {
    setSettings((prev) => ({
      ...prev,
      pageTargeting: {
        ...prev.pageTargeting,
        rules: (prev.pageTargeting.rules || []).map((rule, i) =>
          i === index ? { ...rule, [field]: value } : rule
        ),
      },
    }));
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
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Genel Ayarlar</CardTitle>
          <CardDescription>Bildirimlerin temel davranışlarını yapılandırın.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">Bildirimler Aktif</Label>
            <Switch
              id="isActive"
              checked={settings.isActive}
              onCheckedChange={(checked) => updateSetting('isActive', checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="showOnMobile">Mobilde Göster</Label>
            <Switch
              id="showOnMobile"
              checked={settings.showOnMobile}
              onCheckedChange={(checked) => updateSetting('showOnMobile', checked)}
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="dataMode">Veri Modu</Label>
            <Select value={settings.dataMode} onValueChange={(v) => updateSetting('dataMode', v)}>
              <SelectTrigger id="dataMode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manuel</SelectItem>
                <SelectItem value="real">Gerçek Siparişler</SelectItem>
                <SelectItem value="both">Her İkisi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Widget Kurulumu</Label>
            <p className="text-xs text-muted-foreground">
              Widget mağazanızda görünmüyorsa, yeniden yüklemeyi deneyin.
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleReinjectWidget} disabled={reinjecting}>
                {reinjecting ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                {reinjecting ? 'Yükleniyor...' : 'Widget\'ı Yeniden Yükle'}
              </Button>
              {reinjectResult === 'success' && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle2 className="size-4" /> Başarıyla yüklendi
                </span>
              )}
              {reinjectResult === 'error' && (
                <span className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="size-4" /> Yükleme başarısız
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message Template */}
      <Card>
        <CardHeader>
          <CardTitle>Mesaj Şablonu</CardTitle>
          <CardDescription>Bildirim mesajlarını özelleştirin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="messageTemplate">Mesaj Şablonu</Label>
            <Input
              id="messageTemplate"
              value={settings.messageTemplate}
              onChange={(e) => updateSetting('messageTemplate', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeTemplate">Zaman Şablonu</Label>
            <Input
              id="timeTemplate"
              value={settings.timeTemplate}
              onChange={(e) => updateSetting('timeTemplate', e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Kullanılabilir değişkenler: <code className="rounded bg-muted px-1 py-0.5">{'{{name}}'}</code>,{' '}
            <code className="rounded bg-muted px-1 py-0.5">{'{{product}}'}</code>,{' '}
            <code className="rounded bg-muted px-1 py-0.5">{'{{location}}'}</code>,{' '}
            <code className="rounded bg-muted px-1 py-0.5">{'{{time}}'}</code>
          </p>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Görünüm</CardTitle>
          <CardDescription>Bildirim stilini ve konumunu ayarlayın.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="theme">Tema</Label>
              <Select value={settings.theme} onValueChange={(v) => updateSetting('theme', v)}>
                <SelectTrigger id="theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">Klasik</SelectItem>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Konum</Label>
              <Select value={settings.position} onValueChange={(v) => updateSetting('position', v)}>
                <SelectTrigger id="position">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-left">Sol Alt</SelectItem>
                  <SelectItem value="bottom-right">Sağ Alt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="animation">Animasyon</Label>
              <Select value={settings.animation} onValueChange={(v) => updateSetting('animation', v)}>
                <SelectTrigger id="animation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slide">Kayma</SelectItem>
                  <SelectItem value="fade">Solma</SelectItem>
                  <SelectItem value="bounce">Zıplama</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="colorBg">Arka Plan Rengi</Label>
              <div className="flex gap-2">
                <Input
                  id="colorBg"
                  type="color"
                  value={settings.customColors.background || '#ffffff'}
                  onChange={(e) => updateColor('background', e.target.value)}
                  className="h-9 w-12 cursor-pointer p-1"
                />
                <Input
                  value={settings.customColors.background || '#ffffff'}
                  onChange={(e) => updateColor('background', e.target.value)}
                  placeholder="#ffffff"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="colorText">Yazı Rengi</Label>
              <div className="flex gap-2">
                <Input
                  id="colorText"
                  type="color"
                  value={settings.customColors.text || '#000000'}
                  onChange={(e) => updateColor('text', e.target.value)}
                  className="h-9 w-12 cursor-pointer p-1"
                />
                <Input
                  value={settings.customColors.text || '#000000'}
                  onChange={(e) => updateColor('text', e.target.value)}
                  placeholder="#000000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="colorBorder">Kenarlık Rengi</Label>
              <div className="flex gap-2">
                <Input
                  id="colorBorder"
                  type="color"
                  value={settings.customColors.border || '#e5e7eb'}
                  onChange={(e) => updateColor('border', e.target.value)}
                  className="h-9 w-12 cursor-pointer p-1"
                />
                <Input
                  value={settings.customColors.border || '#e5e7eb'}
                  onChange={(e) => updateColor('border', e.target.value)}
                  placeholder="#e5e7eb"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timing */}
      <Card>
        <CardHeader>
          <CardTitle>Zamanlama</CardTitle>
          <CardDescription>Bildirimlerin gösterim sürelerini ayarlayın.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstDelay">İlk Gecikme (saniye)</Label>
              <Input
                id="firstDelay"
                type="number"
                min={0}
                step={1}
                value={settings.firstDelay / 1000}
                onChange={(e) => updateSetting('firstDelay', Number(e.target.value) * 1000)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayDuration">Gösterim Süresi (saniye)</Label>
              <Input
                id="displayDuration"
                type="number"
                min={1}
                step={1}
                value={settings.displayDuration / 1000}
                onChange={(e) => updateSetting('displayDuration', Number(e.target.value) * 1000)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delayBetween">Bildirimler Arası (saniye)</Label>
              <Input
                id="delayBetween"
                type="number"
                min={1}
                step={1}
                value={settings.delayBetween / 1000}
                onChange={(e) => updateSetting('delayBetween', Number(e.target.value) * 1000)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxPerPage">Sayfa Başına Maksimum</Label>
              <Input
                id="maxPerPage"
                type="number"
                min={1}
                step={1}
                value={settings.maxPerPage}
                onChange={(e) => updateSetting('maxPerPage', Number(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teaser Button */}
      <Card>
        <CardHeader>
          <CardTitle>Teaser Butonu</CardTitle>
          <CardDescription>Bildirim kapatıldıktan sonra gösterilecek mini buton.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="showTeaser">Teaser Göster</Label>
            <Switch
              id="showTeaser"
              checked={settings.showTeaser}
              onCheckedChange={(checked) => updateSetting('showTeaser', checked)}
            />
          </div>
          {settings.showTeaser && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="teaserText">Teaser Metni</Label>
                <Input
                  id="teaserText"
                  value={settings.teaserText}
                  onChange={(e) => updateSetting('teaserText', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teaserBehavior">Teaser Davranışı</Label>
                <Select
                  value={settings.teaserBehavior}
                  onValueChange={(v) => updateSetting('teaserBehavior', v)}
                >
                  <SelectTrigger id="teaserBehavior">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="after-close">Kapatıldıktan Sonra</SelectItem>
                    <SelectItem value="always">Her Zaman</SelectItem>
                    <SelectItem value="never">Asla</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Page Targeting */}
      <Card>
        <CardHeader>
          <CardTitle>Sayfa Hedefleme</CardTitle>
          <CardDescription>Bildirimlerin hangi sayfalarda gösterileceğini belirleyin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pageMode">Hedefleme Modu</Label>
            <Select
              value={settings.pageTargeting.mode}
              onValueChange={(v) => updatePageTargetingMode(v as 'all' | 'selected')}
            >
              <SelectTrigger id="pageMode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Sayfalar</SelectItem>
                <SelectItem value="selected">Sadece Seçili Sayfalar</SelectItem>
                <SelectItem value="excluded">Seçili Sayfaları Hariç Tut</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(settings.pageTargeting.mode === 'selected' || settings.pageTargeting.mode === 'excluded') && (
            <>
              <Separator />
              <p className="text-sm text-muted-foreground">
                {settings.pageTargeting.mode === 'excluded'
                  ? 'URL\'sinde aşağıdaki ifadeleri içeren sayfalarda bildirimler gösterilmez. Örn: sepet, ödeme, hesabım gibi sayfaları hariç tutabilirsiniz.'
                  : 'Bildirimler yalnızca aşağıdaki kurallara uyan sayfalarda gösterilir.'}
              </p>
              <div className="space-y-3">
                {(settings.pageTargeting.rules || []).map((rule, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select
                      value={rule.matchType}
                      onValueChange={(v) => updatePageRule(index, 'matchType', v)}
                    >
                      <SelectTrigger className="w-36 shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contains">İçerir</SelectItem>
                        <SelectItem value="exact">Tam Eşleşme</SelectItem>
                        <SelectItem value="startsWith">İle Başlar</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="https://example.com/..."
                      value={rule.url}
                      onChange={(e) => updatePageRule(index, 'url', e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePageRule(index)}
                      className="shrink-0"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addPageRule}>
                  <Plus className="size-4" />
                  Kural Ekle
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>
    </div>
  );
}

function parseJSON<T>(value: unknown, fallback: T): T {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  if (typeof value === 'object' && value !== null) {
    return value as T;
  }
  return fallback;
}
