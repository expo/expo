import { ScrollView, Text } from 'react-native';

export default function Page() {
  return (
    <ScrollView style={{ padding: 16 }}>
      <Text
        testID="modal-title-full"
        style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        Full Screen Modal
      </Text>
      <Text>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua.
      </Text>
      <Text>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua.
      </Text>
    </ScrollView>
  );
}
