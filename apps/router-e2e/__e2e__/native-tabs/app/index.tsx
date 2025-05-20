import { Link, useNavigation } from 'expo-router';
import { useScrollOnSelect } from 'expo-router/build/ui/NativeBottomTabs/useScrollOnSelect';
import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const colors = [
  { bg: '#f00', text: '#fff' },
  { bg: '#0f0', text: '#000' },
  { bg: '#00f', text: '#fff' },
];

export default function Index() {
  const items = useMemo(() => Array.from({ length: 50 }, (_, i) => i), []);
  const navigation = useNavigation();
  const { top } = useSafeAreaInsets();

  const { scrollViewRef } = useScrollOnSelect({
    navigation,
    topInset: top,
  });

  return (
    <ScrollView
      style={{ flex: 1, width: '100%', backgroundColor: '#faa', padding: 16 }}
      ref={scrollViewRef}
      scrollToOverflowEnabled
      contentInsetAdjustmentBehavior="automatic">
      <Text testID="e2e-screen">One</Text>
      <Link testID="e2e-goto-apple" href="/two">
        Goto TWO
      </Link>
      <Link testID="e2e-goto-three" href="/three/orange">
        Goto Orange
      </Link>
      {items.map((item, index) => {
        const { bg, text } = colors[index % colors.length];
        return (
          <View
            key={item}
            style={{
              backgroundColor: bg,
              padding: 20,
              marginVertical: 5,
              borderRadius: 10,
            }}>
            <Text style={{ color: text }}>{item}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}
