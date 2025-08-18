import { Link } from 'expo-router';
import { Modal } from 'expo-router/build/modal/Modal';
import { useState } from 'react';
import { Button, ScrollView, View } from 'react-native';

import { MutateButton } from '../components/MutateButton';

export default function FormsheetDemos() {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ padding: 20, gap: 12 }}>
      <PagesheetBaseDemo />
    </ScrollView>
  );
}

function PagesheetBaseDemo() {
  const [open, setIsOpen] = useState(false);
  const [count, setCount] = useState(1);
  return (
    <>
      <Button title="Pagesheet" onPress={() => setIsOpen((open) => !open)} />
      <Modal visible={open} onClose={() => setIsOpen(false)} presentationStyle="pageSheet">
        <ScrollView
          style={{ gap: 8 }}
          contentContainerStyle={{
            padding: 16,
            gap: 8,
          }}
          automaticallyAdjustsScrollIndicatorInsets
          contentInsetAdjustmentBehavior="automatic">
          {Array.from({ length: count }).map((_, index) => (
            <View
              key={String(index)}
              style={{
                padding: 24,
                backgroundColor: '#ccc',
                borderRadius: 16,
                borderCurve: 'continuous',
              }}
            />
          ))}

          <View
            style={{
              gap: 4,
              flex: 1,
              flexDirection: 'row',
            }}>
            <MutateButton onPress={() => setCount((count) => count + 1)}>Add</MutateButton>
            <MutateButton onPress={() => setCount(Math.max(count - 1, 0))}>Remove</MutateButton>
          </View>
          <Link href="/random">Go to Different Screen</Link>
          <Button
            title="Close"
            onPress={() => {
              console.log('Closing modal');
              setIsOpen(false);
            }}
          />
        </ScrollView>
      </Modal>
    </>
  );
}
