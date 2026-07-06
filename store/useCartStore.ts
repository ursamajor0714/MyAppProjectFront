import { create } from 'zustand';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  color: string;
  type: string;
  quantity: number;
}

interface CartState {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity: number) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  cart: [],
  addToCart: (item, quantity) => set((state) => {
    const existing = state.cart.find((c) => c.id === item.id);
    if (existing) {
      return {
        cart: state.cart.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + quantity } : c
        )
      };
    }
    return { cart: [...state.cart, { ...item, quantity }] };
  }),
  removeFromCart: (id) => set((state) => ({
    cart: state.cart.filter((c) => c.id !== id)
  })),
  updateQuantity: (id, quantity) => set((state) => ({
    cart: state.cart.map((c) =>
      c.id === id ? { ...c, quantity } : c
    )
  })),
  clearCart: () => set({ cart: [] })
}));
