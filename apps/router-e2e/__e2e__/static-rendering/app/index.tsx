import { Modal, useNavigation, usePathname, useSegments } from 'expo-router';
import { useState } from 'react';
import { Button, Text, View } from 'react-native';

export default function Page() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pathname = usePathname();
  return (
    <View>
      <Text testID="index-text" style={{ fontFamily: 'sweet' }}>
        Index ({pathname})
      </Text>
      <Button
        title="Open modal"
        onPress={() => {
          setIsModalOpen(true);
        }}
      />
      <Modal
        visible={isModalOpen}
        onRequestClose={() => {
          setIsModalOpen(false);
        }}>
        <ModalContent
          onCloseButtonPressed={() => {
            setIsModalOpen(false);
          }}
        />
      </Modal>
    </View>
  );
}

function ModalContent({ onCloseButtonPressed }: { onCloseButtonPressed: () => void }) {
  const navigation = useNavigation();
  const pathname = usePathname();
  const segments = useSegments();

  console.log(navigation.getParent());

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#f00',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text>Hi from modal</Text>
      <Text>{pathname}</Text>
      <Text>{segments}</Text>
      <Button title="goBack" onPress={() => navigation.goBack()} />
      <Button title="close" onPress={onCloseButtonPressed} />
    </View>
  );
}
