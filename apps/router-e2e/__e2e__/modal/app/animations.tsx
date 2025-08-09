import { Modal } from 'expo-router/build/modal/Modal';
import { useState } from 'react';
import { Button, ScrollView, Text, View } from 'react-native';

const presentationStyles = ['formSheet', 'pageSheet', 'fullScreen'] as const;
const animationTypes = ['slide', 'fade', 'none'] as const;

const modals = presentationStyles.flatMap((style) =>
  animationTypes.map((animation) => `${style}-${animation}` as const)
);

const initialState = modals.reduce<Record<string, boolean>>((acc, key) => {
  acc[key] = false;
  return acc;
}, {});

export default function AnimationsDemos() {
  const [state, setState] = useState(initialState);

  const buttons = modals.map((modal) => (
    <View key={modal} style={{ marginBottom: 6, flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ marginRight: 8 }}>
        {modal}: {state[modal] ? 'Open' : 'Closed'}
      </Text>
      <Button title="Open" onPress={() => setState((prev) => ({ ...prev, [modal]: true }))} />
      <Button title="Close" onPress={() => setState((prev) => ({ ...prev, [modal]: false }))} />
    </View>
  ));

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ padding: 20, gap: 12 }}>
      {buttons}
      {modals.map((modal) => (
        <Modal
          key={modal}
          visible={state[modal]}
          presentationStyle={modal.split('-')[0] as 'formSheet' | 'pageSheet' | 'fullScreen'}
          animationType={modal.split('-')[1] as 'slide' | 'fade' | 'none'}
          style={{
            backgroundColor: '#EEC0C6',
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
          }}
          onClose={() => setState((prev) => ({ ...prev, [modal]: false }))}>
          <Text>{modal}</Text>
          {buttons}
        </Modal>
      ))}
    </ScrollView>
  );
}
