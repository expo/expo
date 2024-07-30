import { Stack } from 'expo-router';

import Products from '@/components/www/products';

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
