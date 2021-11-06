import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const responseProduct = await api.get<Product>(`/products/${productId}`);
      const responseStock = await api.get<Stock>(`/stock/${productId}`);

      const stock = responseStock.data;
      const product = responseProduct.data;

      const haveInCart = cart.find((cart) => cart.id === productId);

      if (!haveInCart) {
        const newProduct: Product = {
          ...product,
          amount: 1,
        };
        setCart([...cart, newProduct]);
        localStorage.setItem(
          '@RocketShoes:cart',
          JSON.stringify([...cart, newProduct])
        );
        return;
      }

      const noStock = cart.find(
        (cart) => cart.id === productId && cart.amount === stock.amount
      );

      if (noStock) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const carts = cart.map((cart) => {
        if (cart.id === productId) {
          cart.amount += 1;
        }
        return cart;
      });

      setCart(carts);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(carts));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const product = cart.find((product) => product.id === productId);

      if (!product) {
        throw new Error('product that does not exist');
      }

      const products = cart.filter((product) => product.id !== productId);
      setCart(products);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(products));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const responseStock = await api.get<Stock>(`/stock/${productId}`);
      const stock = responseStock.data;

      if (amount <= 0) return;

      if (amount > stock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (amount > stock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
      }

      const products = cart.map((product) => {
        if (product.id === productId) {
          product.amount = amount;
        }

        return product;
      });

      setCart(products);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(products));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
