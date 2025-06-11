import { Modal } from 'expo-router';
import { useState } from 'react';
import { Button, Text, View } from 'react-native';

export default function ModalScreen() {
  const [isOpen, setIsOpen] = useState(false);
  console.log('/modal isOpen', isOpen);
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Modal</Text>
      <Button
        title="Open <Modal>"
        onPress={() => {
          setIsOpen(true);
        }}
      />
      {isOpen && (
        <Modal
          visible={isOpen}
          onClose={() => {
            setIsOpen(false);
          }}
          transparent
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ padding: 20, backgroundColor: 'white', borderRadius: 10 }}>
            <Text>Inner modal</Text>
            <Button
              title="Close Modal"
              onPress={() => {
                console.log('Closing modal');
                setIsOpen(false);
              }}
            />
          </View>
        </Modal>
      )}
    </View>
  );
}
