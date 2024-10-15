import { Link } from 'expo-router/build/rsc/exports';

import { Text, ScrollView } from 'react-native';

export default function IndexRoute() {
  const products = new Array(10).fill(0).map((_, i) => i + 1);

  return (
    <ScrollView
      style={{ flex: 1, padding: 12 }}
      testID="child-wrapper"
      contentContainerStyle={{
        gap: 8,
      }}>
      <Text testID="index-text">Hello World</Text>
      {products.map((product) => (
        <Link key={product} href={'/product/' + product}>
          Go to {product}
        </Link>
      ))}
    </ScrollView>
  );
}

export const unstable_settings = {
  render: 'static',
};
