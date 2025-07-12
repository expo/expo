import { ScrollView, Text } from 'react-native';

export default function Page() {
  return (
    <ScrollView style={{ padding: 16 }}>
      <Text
        testID="modal-title-full"
        style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        Full Screen Modal
      </Text>
      {Array.from({ length: 60 }).map((_, idx) => (
        <Text key={idx}>This modal should occupy the full screen (no detents).</Text>
      ))}
    </ScrollView>
  );
}
