'use client';

import { useState } from 'react';
import { ApiRequests } from '@/lib/api-requests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus } from 'lucide-react';
import { ProductSelector } from './product-selector';

interface SelectedProduct {
  id: string;
  name: string;
  image: string | null;
  href: string | null;
}

interface NotificationFormProps {
  token: string;
  onCreated: () => void;
}

export function NotificationForm({ token, onCreated }: NotificationFormProps) {
  const [customerName, setCustomerName] = useState('');
  const [location, setLocation] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);
  const [manualProductName, setManualProductName] = useState('');
  const [isPrioritized, setIsPrioritized] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) return;

    setSubmitting(true);
    try {
      await ApiRequests.notifications.create(token, {
        customerName: customerName.trim(),
        location: location.trim(),
        productId: selectedProduct?.id ?? null,
        productName: selectedProduct?.name ?? manualProductName.trim(),
        productImage: selectedProduct?.image ?? null,
        productHref: selectedProduct?.href ?? null,
        isPrioritized,
      });

      // Reset form
      setCustomerName('');
      setLocation('');
      setSelectedProduct(null);
      setManualProductName('');
      setIsPrioritized(false);
      onCreated();
    } catch (error) {
      console.error('Error creating notification:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = customerName.trim().length > 0 && (selectedProduct !== null || manualProductName.trim().length > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manuel Bildirim Ekle</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Müşteri Adı *</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Örn: Ahmet Y."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Konum</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Örn: İstanbul"
            />
          </div>

          <div className="space-y-2">
            <Label>Ürün *</Label>
            <ProductSelector
              token={token}
              onSelect={(product) => {
                setSelectedProduct(product);
                setManualProductName('');
              }}
              selectedName={selectedProduct?.name ?? ''}
            />
          </div>

          {!selectedProduct && (
            <div className="space-y-2">
              <Label htmlFor="manualProductName">veya Ürün Adını Yazın</Label>
              <Input
                id="manualProductName"
                value={manualProductName}
                onChange={(e) => setManualProductName(e.target.value)}
                placeholder="Örn: Siyah Deri Çanta"
              />
              <p className="text-xs text-muted-foreground">
                Ürün araması çalışmıyorsa adı manuel girebilirsiniz.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="isPrioritized">Öncelikli</Label>
            <Switch
              id="isPrioritized"
              checked={isPrioritized}
              onCheckedChange={setIsPrioritized}
            />
          </div>

          <Button type="submit" disabled={submitting || !isValid} className="w-full">
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            {submitting ? 'Ekleniyor...' : 'Ekle'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
