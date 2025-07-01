import { Modal } from 'expo-router';
import { useMemo, useState } from 'react';
import { Button, Text, View, Modal as RNModal } from 'react-native';

export default function ModalScreen() {
  const [isOpen, setIsOpen] = useState(false);
  const [isInnerOpen, setIsInnerOpen] = useState(false);
  console.log('/modal isOpen', isOpen);
  console.log('/modal isInnerOpen', isInnerOpen);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Modal</Text>
      <Button
        title="Open <Modal>"
        onPress={() => {
          setIsOpen(true);
        }}
      />
      <Modal
        visible={isOpen}
        onDidClose={() => {
          console.log('Modal did close');
          setIsOpen(false);
        }}
        onRequestClose={() => {
          console.log('Modal request close');
        }}
        transparent
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ padding: 20, backgroundColor: 'white', borderRadius: 10 }}>
          <Text>&lt;Modal&gt;</Text>
          <Text>InnerModalOpen: {isInnerOpen ? 'true' : 'false'}</Text>
          <Button
            title="Close <Modal>"
            onPress={() => {
              console.log('Closing modal');
              setIsOpen(false);
            }}
          />
          <Button
            title="Open inner modal"
            onPress={() => {
              console.log('Opening inner modal');
              setIsInnerOpen(true);
            }}
          />
          <Modal
            visible={isInnerOpen}
            onDidClose={() => {
              console.log('Inner modal did close');
              setIsInnerOpen(false);
            }}
            onRequestClose={() => {
              console.log('Inner modal request close');
              setIsInnerOpen(false);
            }}
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ padding: 20, backgroundColor: 'white', borderRadius: 10 }}>
              <Text>Inner Modal</Text>
              <Button
                title="Close inner modal"
                onPress={() => {
                  console.log('Closing inner modal');
                  setIsInnerOpen(false);
                }}
              />
              <Button
                title="Close <Modal>"
                onPress={() => {
                  console.log('Closing modal');
                  setIsOpen(false);
                }}
              />
            </View>
          </Modal>
        </View>
      </Modal>
    </View>
  );
}
