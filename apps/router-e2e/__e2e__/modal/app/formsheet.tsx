import { Link, Modal } from 'expo-router';
import { useState } from 'react';
import { Button, ScrollView, Text, TextInput, View } from 'react-native';

import { MutateButton } from '../components/MutateButton';

export default function FormsheetDemos() {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ padding: 20, gap: 12 }}>
      <FormsheetBaseDemo />
      <FormsheetFitToContentsDemo />
      <FormsheetDetentsDemo />
      <FormsheetUnmountDemo />
    </ScrollView>
  );
}

function FormsheetBaseDemo() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button title="Base Formsheet Modal" onPress={() => setIsOpen(true)} />
      <Modal visible={isOpen} onClose={() => setIsOpen(false)} presentationStyle="formSheet">
        <View style={{ padding: 20 }}>
          <Text>This is a Base Formsheet Modal</Text>
          <Button title="Close" onPress={() => setIsOpen(false)} />
          <Link href="/random">Go to Different Screen</Link>
          <TextInput
            placeholder="Type something..."
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 8,
              padding: 12,
              marginTop: 12,
            }}
          />
        </View>
      </Modal>
    </>
  );
}

function FormsheetUnmountDemo() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button title="Formsheet Modal with unmounting" onPress={() => setIsOpen(true)} />
      {isOpen && (
        <Modal visible onClose={() => setIsOpen(false)} presentationStyle="formSheet">
          <View style={{ padding: 20 }}>
            <Text>This is a Formsheet Modal</Text>
            <Button title="Unmount" onPress={() => setIsOpen(false)} />
          </View>
        </Modal>
      )}
    </>
  );
}

function FormsheetFitToContentsDemo() {
  const [open, setIsOpen] = useState(false);
  const [count, setCount] = useState(1);
  return (
    <>
      <Button title="Formsheet fitToContents" onPress={() => setIsOpen((open) => !open)} />
      <Modal
        visible={open}
        onClose={() => setIsOpen(false)}
        presentationStyle="formSheet"
        detents="fitToContents">
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
          <TextInput
            placeholder="Type something..."
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 8,
              padding: 12,
              marginTop: 12,
            }}
          />
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

function FormsheetDetentsDemo() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button title="Formsheet Modal (Detents)" onPress={() => setIsOpen(true)} />
      <Modal
        visible={isOpen}
        detents={[0.25, 0.5, 0.75, 1]}
        onClose={() => setIsOpen(false)}
        presentationStyle="formSheet">
        <View style={{ padding: 20 }}>
          <Text>This is a Formsheet Modal with detents 0.25, 0.5, 0.75, 1</Text>
          <TextInput
            placeholder="Type something..."
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 8,
              padding: 12,
              marginTop: 12,
            }}
          />
          <Link href="/random">Go to Different Screen</Link>
          <Button title="Close" onPress={() => setIsOpen(false)} />
        </View>
      </Modal>
    </>
  );
}
