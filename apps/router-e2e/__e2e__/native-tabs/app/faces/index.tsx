import { useTheme } from '@react-navigation/native';
import { ScrollView } from 'react-native';

import { Faces } from '../../components/faces';

export default function Index() {
  const { colors } = useTheme();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        alignItems: 'center',
        padding: 32,
      }}>
      <Faces numberOfFaces={60} />
    </ScrollView>
  );
}
