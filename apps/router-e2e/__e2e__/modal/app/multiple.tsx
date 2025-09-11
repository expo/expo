import { Link } from 'expo-router';
import { Modal } from 'expo-router/build/modal/Modal';
import type { ModalProps } from 'expo-router/build/modal/Modal';
import { useState } from 'react';
import { Button, ScrollView, Text, View } from 'react-native';

interface ModalConfig {
  id: string;
  presentationStyle: ModalProps['presentationStyle'];
}

export default function MultipleModalsDemos() {
  const [modals, setModals] = useState<ModalConfig[]>([]);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ padding: 20, gap: 12 }}>
      <ModalContent
        id={undefined}
        openedModals={modals}
        onOpen={(presentationStyle) => {
          setModals((prev) => [...prev, { id: `${prev.length + 1}`, presentationStyle }]);
        }}
        onClose={(id) => {
          setModals((prev) => prev.filter((m) => m.id !== id));
        }}
      />
      {modals.map((modal) => (
        <Modal
          key={modal.id}
          visible
          onClose={() => {
            setModals((prev) => prev.filter((m) => m.id !== modal.id));
          }}
          presentationStyle={modal.presentationStyle}>
          <ModalContent
            id={modal.id}
            openedModals={modals}
            onOpen={(presentationStyle) => {
              setModals((prev) => [...prev, { id: `${prev.length + 1}`, presentationStyle }]);
            }}
            onClose={(id) => {
              setModals((prev) => prev.filter((m) => m.id !== id));
            }}
          />
        </Modal>
      ))}
    </ScrollView>
  );
}

interface ModalContentProps {
  id: string | undefined;
  openedModals: ModalConfig[];
  onOpen?: (presentationStyle: ModalProps['presentationStyle']) => void;
  onClose?: (id: string) => void;
}

function ModalContent({ id, openedModals, onOpen, onClose }: ModalContentProps) {
  return (
    <View style={{ paddingHorizontal: 20, paddingVertical: 60 }}>
      <Link href="/random">Go to Different Screen</Link>
      <Text>Modal {id}</Text>
      <Text>Opened modals:</Text>
      {openedModals.map((modal) => (
        <View
          key={modal.id}
          style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
          <Text key={modal.id}>
            {modal.id} ({modal.presentationStyle})
          </Text>
          <Button title="Close" onPress={() => onClose?.(modal.id)} />
        </View>
      ))}
      <Button title="Open formsheet" onPress={() => onOpen?.('formSheet')} />
      <Button title="Open pagesheet" onPress={() => onOpen?.('pageSheet')} />
      <Button title="Open fullscreen" onPress={() => onOpen?.('fullScreen')} />
    </View>
  );
}
