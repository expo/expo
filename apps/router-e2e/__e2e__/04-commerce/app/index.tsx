import { Link } from 'expo-router/build/rsc/exports';

import { Text, ScrollView } from 'react-native';
import { Button } from '../lib/button';
import ClassicNavigation from '../components/classic-navigation';
export default function IndexRoute(props) {
  const products = new Array(10).fill(0).map((_, i) => i + 1);

  return <ClassicNavigation />;
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

      <Button
        onPress={async () => {
          'use server';

          const { execAsync } = require('@expo/osascript');

          // Run the Loom confetti hot key: Control + Command + C
          execAsync(
            'tell application "System Events" to keystroke "c" using {control down, command down}'
          );
        }}
      />
    </ScrollView>
  );
}

export const unstable_settings = {
  render: 'static',
};
