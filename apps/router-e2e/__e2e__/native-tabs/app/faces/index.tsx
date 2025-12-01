import { useTheme } from '@react-navigation/native';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Faces } from '../../components/faces';

export default function Index() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        alignItems: 'center',
        padding: 32,
        paddingTop: insets.top,
      }}>
      <Faces numberOfFaces={60} />
    </ScrollView>
  );
}
