import { useLocalSearchParams } from 'expo-router';
import { TabTrigger } from 'expo-router/ui';
import { Text } from 'react-native';

export default function NewOne() {
  // There is no index route for this directory, so the slug could be undefined
  const { slug = 'thumbs-up' } = useLocalSearchParams();
  return (
    <>
      <Text>{slug}</Text>
      <TabTrigger name="movies">
        <Text>Movies</Text>
      </TabTrigger>
    </>
  );
}
