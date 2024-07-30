import Products from '@/components/www/products';
import { Stack } from 'expo-router';

export default function ProductsPage() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Products',
        }}
      />
      <Products />
    </>
  );
}
