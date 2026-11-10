import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from 'react-native';

import { ColumnScreen, OptionButton } from '@/components/split-view';

export default function Item() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <ColumnScreen column="content">
      <Text>Selected: {id}</Text>
      <OptionButton label="Close item" onPress={() => router.replace('/split-view')} />
    </ColumnScreen>
  );
}
