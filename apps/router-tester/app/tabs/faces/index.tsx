import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Faces } from '../../../components/faces';
import { TabBarHiddenToggle } from '../../../components/tab-bar-hidden-context';

export default function Index() {
  return (
    <ScrollView style={{ flex: 1 }}>
      <SafeAreaView
        edges={['left', 'right']}
        style={{
          alignItems: 'center',
          padding: 32,
        }}>
        <TabBarHiddenToggle />
        <Faces numberOfFaces={60} />
      </SafeAreaView>
    </ScrollView>
  );
}
