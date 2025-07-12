import { useIsPreview } from 'expo-router';
import { Text, View } from 'react-native';

export default function PreviewOne() {
  const isPreview = useIsPreview();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Preview One</Text>
      {isPreview ? <Text>(Preview Mode)</Text> : <Text>(Screen Mode)</Text>}
    </View>
  );
}
