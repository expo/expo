import { useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PresentationPanel } from '../../components/presentation-panel';

export default function Screen() {
  const { presentation } = useLocalSearchParams<{ presentation: string }>();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <SafeAreaView edges={['left', 'right']}>
        <PresentationPanel title={presentation} />
      </SafeAreaView>
    </ScrollView>
  );
}
