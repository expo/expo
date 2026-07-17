import { useRouterColor } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

const colorNames = ['primary', 'secondary', 'tertiary', 'error', 'surface', 'outline'] as const;

export default function ColorScreen() {
  const color = useRouterColor();
  const [initialPrimary] = useState(() => color.android.dynamic.primary);
  const primary = color.android.dynamic.primary;

  return (
    <View style={{ flex: 1, gap: 16, padding: 24 }}>
      <Text testID="palette-status">
        {`status: ${primary === initialPrimary ? 'initial' : 'updated'}`}
      </Text>
      {colorNames.map((name) => {
        const value = color.android.dynamic[name];
        return (
          <View key={name} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 48, height: 48, backgroundColor: value }} />
            <View>
              <Text>{name}</Text>
              <Text testID={`dynamic-${name}-hex`}>{String(value)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
