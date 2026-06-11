'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Trash2 } from 'lucide-react';

export interface NotificationEntry {
  id: string;
  source: string;
  customerName: string;
  location: string;
  productId?: string | null;
  productName: string;
  productImage?: string | null;
  productHref?: string | null;
  isPrioritized: boolean;
  isActive: boolean;
  purchaseDate: string;
  createdAt: string;
}

interface NotificationTableProps {
  entries: NotificationEntry[];
  onTogglePriority: (id: string, value: boolean) => void;
  onToggleActive: (id: string, value: boolean) => void;
  onDelete: (id: string) => void;
}

export function NotificationTable({ entries, onTogglePriority, onToggleActive, onDelete }: NotificationTableProps) {
  if (entries.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Henüz bildirim verisi yok.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-3 py-2 text-left font-medium">Kaynak</th>
            <th className="px-3 py-2 text-left font-medium">İsim</th>
            <th className="px-3 py-2 text-left font-medium">Ürün</th>
            <th className="px-3 py-2 text-left font-medium">Konum</th>
            <th className="px-3 py-2 text-center font-medium">Öncelik</th>
            <th className="px-3 py-2 text-center font-medium">Aktif</th>
            <th className="px-3 py-2 text-center font-medium">Sil</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b last:border-b-0 hover:bg-muted/30">
              <td className="px-3 py-2">
                <Badge variant={entry.source === 'manual' ? 'secondary' : 'default'}>
                  {entry.source === 'manual' ? 'Manuel' : 'Sipariş'}
                </Badge>
              </td>
              <td className="px-3 py-2">{entry.customerName}</td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  {entry.productImage ? (
                    <img
                      src={entry.productImage}
                      alt={entry.productName}
                      className="size-7 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="flex size-7 shrink-0 items-center justify-center rounded bg-muted text-[10px] text-muted-foreground">
                      --
                    </div>
                  )}
                  <span className="max-w-[200px] truncate">{entry.productName}</span>
                </div>
              </td>
              <td className="px-3 py-2 text-muted-foreground">{entry.location || '—'}</td>
              <td className="px-3 py-2 text-center">
                <Switch
                  checked={entry.isPrioritized}
                  onCheckedChange={(checked) => onTogglePriority(entry.id, checked)}
                />
              </td>
              <td className="px-3 py-2 text-center">
                <Switch
                  checked={entry.isActive}
                  onCheckedChange={(checked) => onToggleActive(entry.id, checked)}
                />
              </td>
              <td className="px-3 py-2 text-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(entry.id)}
                  className="size-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
