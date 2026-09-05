import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { products, type Product } from "@/data/products";

export type CartItem = {
  productId: string;
  size: string;
  color: string;
  quantity: number;
};

export type CartLine = CartItem & { product: Product; lineTotal: number };

const STORAGE_KEY = "weave-cart-v1";
const SENTINEL_KEY = "weave-sentinel-v1";

// Sentinel is an included protection framework — zero customer surcharge
export const SENTINEL_FEE = 0;
export const SHIPPING_FLAT = 0;
export const FREE_SHIPPING_THRESHOLD = 0;

type CartContextValue = {
  items: CartItem[];
  lines: CartLine[];
  count: number;
  subtotal: number;
  shipping: number;
  sentinelCost: number;
  total: number;
  sentinel: boolean;
  isActivating: boolean;
  setSentinel: (on: boolean) => void;
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const sameLine = (a: CartItem, productId: string, size: string, color: string) =>
  a.productId === productId && a.size === size && a.color === color;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [sentinel, setSentinelState] = useState(true); // default active for demo
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
      const savedSentinel = localStorage.getItem(SENTINEL_KEY);
      if (savedSentinel !== null) {
        setSentinelState(savedSentinel === "true");
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(SENTINEL_KEY, String(sentinel));
    } catch {
      /* ignore */
    }
  }, [sentinel]);

  const setSentinel = (next: boolean) => {
    if (next && !sentinel) {
      // Trigger full-screen cinematic Sentinel activation overlay
      setIsActivating(true);
      setSentinelState(true);
      setTimeout(() => {
        setIsActivating(false);
      }, 2500);
    } else {
      // Turning OFF returns immediately without activation sequence
      setIsActivating(false);
      setSentinelState(next);
    }
  };

  const value = useMemo<CartContextValue>(() => {
    const lines: CartLine[] = items.flatMap((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return [];
      return [{ ...item, product, lineTotal: product.price * item.quantity }];
    });

    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
    // Sentinel protection is included free of charge
    const sentinelCost = 0;

    return {
      items,
      lines,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotal,
      shipping,
      sentinelCost,
      total: subtotal + shipping, // Total NEVER adds extra charge
      sentinel,
      isActivating,
      setSentinel,
      addItem: (item) =>
        setItems((prev) => {
          const existing = prev.find((p) => sameLine(p, item.productId, item.size, item.color));
          if (existing) {
            return prev.map((p) =>
              sameLine(p, item.productId, item.size, item.color)
                ? { ...p, quantity: p.quantity + item.quantity }
                : p,
            );
          }
          return [...prev, item];
        }),
      updateQuantity: (productId, size, color, quantity) =>
        setItems((prev) =>
          quantity <= 0
            ? prev.filter((p) => !sameLine(p, productId, size, color))
            : prev.map((p) => (sameLine(p, productId, size, color) ? { ...p, quantity } : p)),
        ),
      removeItem: (productId, size, color) =>
        setItems((prev) => prev.filter((p) => !sameLine(p, productId, size, color))),
      clearCart: () => setItems([]),
    };
  }, [items, sentinel, isActivating]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
