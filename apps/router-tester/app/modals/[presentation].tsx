import { useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';

import { PresentationPanel } from '../../components/presentation-panel';

export default function Screen() {
  const { presentation } = useLocalSearchParams<{ presentation: string }>();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <PresentationPanel title={presentation} />
    </ScrollView>
  );
}
