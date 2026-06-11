'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiRequests } from '@/lib/api-requests';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';

interface ProductResult {
  id: string;
  name: string;
  image: string | null;
  href: string | null;
}

interface ProductSelectorProps {
  token: string;
  onSelect: (product: { id: string; name: string; image: string | null; href: string | null }) => void;
  selectedName?: string;
}

export function ProductSelector({ token, onSelect, selectedName }: ProductSelectorProps) {
  const [query, setQuery] = useState(selectedName ?? '');
  const [results, setResults] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external selectedName changes
  useEffect(() => {
    if (selectedName !== undefined) {
      setQuery(selectedName);
    }
  }, [selectedName]);

  const search = useCallback(
    async (q: string) => {
      setLoading(true);
      try {
        const res = await ApiRequests.products.search(token, q);
        if (res.status === 200 && res.data?.data?.products) {
          setResults(res.data.data.products);
        }
      } catch (error) {
        console.error('Product search failed:', error);
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  const handleChange = (value: string) => {
    setQuery(value);
    setOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      search(value);
    }, 300);
  };

  const handleSelect = (product: ProductResult) => {
    setQuery(product.name);
    setOpen(false);
    onSelect({ id: product.id, name: product.name, image: product.image, href: product.href });
  };

  const handleFocus = () => {
    setOpen(true);
    if (results.length === 0) {
      search(query);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Don't close if clicking inside the dropdown
    if (containerRef.current?.contains(e.relatedTarget as Node)) return;
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Ürün ara..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          className="pl-8"
        />
        {loading && <Loader2 className="absolute right-2.5 top-2.5 size-4 animate-spin text-muted-foreground" />}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover shadow-md">
          {results.map((product) => (
            <button
              key={product.id}
              type="button"
              className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(product)}
            >
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="size-8 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="flex size-8 shrink-0 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                  --
                </div>
              )}
              <span className="truncate">{product.name}</span>
            </button>
          ))}
        </div>
      )}

      {open && !loading && results.length === 0 && query.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-3 text-center text-sm text-muted-foreground shadow-md">
          Ürün bulunamadı
        </div>
      )}
    </div>
  );
}
