import { Link, Modal } from 'expo-router';
import { createContext, use, useState } from 'react';
import { Button, Text, View } from 'react-native';

function ScreenContent() {
  const [isOpenA, setIsOpenA] = useState(false);
  const { randomValue, next } = use(RandomContext);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Index</Text>
      <Text>Random value: {randomValue}</Text>
      <Button
        title="Next Random Value"
        onPress={() => {
          next();
        }}
      />
      <Button
        title="Open Modal A"
        onPress={() => {
          setIsOpenA(true);
        }}
      />
      <Modal
        visible={isOpenA}
        onRequestClose={() => {
          setIsOpenA(false);
        }}
        animationType="slide"
        presentationStyle="pageSheet"
        style={{
          backgroundColor: '#C2FBEF',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
        }}>
        <RandomContext value={use(RandomContext)}>
          <ModalContent onClose={() => setIsOpenA(false)} />
        </RandomContext>
      </Modal>
    </View>
  );
}

function ModalContent({ onClose }: { onClose: () => void }) {
  const { randomValue, next } = use(RandomContext);
  return (
    <View
      style={{
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
      }}>
      <Text>Modal Content</Text>
      <Text>Random value: {randomValue}</Text>
      <Button
        title="Next Random Value"
        onPress={() => {
          next();
        }}
      />
      <Button
        title="Close Modal"
        onPress={() => {
          onClose();
        }}
      />
    </View>
  );
}

const RandomContext = createContext<{ randomValue: number; next: () => void }>({
  randomValue: 0,
  next: () => {},
});

export default function Screen() {
  const [value, setValue] = useState(parseFloat(Math.random().toFixed(2)));
  const next = () => {
    setValue(parseFloat(Math.random().toFixed(2)));
  };
  return (
    <RandomContext value={{ randomValue: value, next }}>
      <ScreenContent />
    </RandomContext>
  );
}
