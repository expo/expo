import { ScrollView } from 'react-native';

import { Faces } from '../../../components/faces';
import { TabBarHiddenToggles } from '../../../components/tab-bar-hidden-context';

export default function Index() {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        alignItems: 'center',
        padding: 32,
      }}>
      <TabBarHiddenToggles />
      <Faces numberOfFaces={60} />
    </ScrollView>
  );
}
