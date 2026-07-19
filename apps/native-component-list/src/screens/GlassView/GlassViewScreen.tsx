import { Platform, View } from 'react-native';

import { BodyText } from '../../components/BodyText';

export default function GlassViewScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <BodyText>GlassView is not supported on {Platform.OS}</BodyText>
    </View>
  );
}
