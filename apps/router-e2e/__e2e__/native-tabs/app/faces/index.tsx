import { ScrollView } from 'react-native';

import { Faces } from '../../components/faces';

export default function Index() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: '#000' }}
      contentContainerStyle={{
        alignItems: 'center',
        padding: 32,
      }}>
      <Faces numberOfFaces={60} />
    </ScrollView>
  );
}
