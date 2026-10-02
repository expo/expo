import { Suspense, useState } from 'react';
import { Button, Text, View } from 'react-native';

export default function LargeSuspenseRoute() {
  return (
    <Suspense fallback={<Text testID="large-suspense-fallback">Loading large content</Text>}>
      <CompletedContent />
    </Suspense>
  );
}

function CompletedContent() {
  const [count, setCount] = useState(0);

  return (
    <View>
      <Button
        testID="large-suspense-increment"
        title="Increment"
        onPress={() => setCount(count + 1)}
      />
      <Text testID="large-suspense-count">{count}</Text>
      {/* Exceed the previous 25,600-byte threshold without suspending during rendering. */}
      <Text testID="large-suspense-content">{'Completed Suspense content. '.repeat(2048)}</Text>
    </View>
  );
}
