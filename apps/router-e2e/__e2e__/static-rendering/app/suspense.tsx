import { Suspense, use, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

let content: Promise<string> | undefined;

function DelayedContent() {
  content ??= new Promise((resolve) => setTimeout(() => resolve('x'.repeat(30_000)), 25));
  const text = use(content);
  const [count, setCount] = useState(0);

  return (
    <View testID="resolved-suspense">
      <Text testID="suspense-content" style={{ color: 'green' }}>
        {text}
        FINAL_SUSPENSE_SENTINEL
      </Text>
      <Pressable testID="increment" onPress={() => setCount(count + 1)}>
        <Text testID="count">Count: {count}</Text>
      </Pressable>
    </View>
  );
}

export default function SuspensePage() {
  return (
    <Suspense fallback={<Text>Loading page</Text>}>
      <View testID="suspense-page">
        <Suspense fallback={<Text>Loading content</Text>}>
          <DelayedContent />
        </Suspense>
      </View>
    </Suspense>
  );
}
