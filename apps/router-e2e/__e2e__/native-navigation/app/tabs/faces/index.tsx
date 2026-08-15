import { ScrollView } from 'react-native';

import { Faces } from '../../../components/faces';
import { TabBarHiddenToggle } from '../../../components/tab-bar-hidden-context';

export default function Index() {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        alignItems: 'center',
        padding: 32,
      }}>
      <TabBarHiddenToggle />
      <Faces numberOfFaces={60} />
    </ScrollView>
  );
}
