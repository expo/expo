import { router } from 'expo-router';
import { Button, Text, View } from 'react-native';

export default function TabOne() {
  return (
    <View
      testID="tab-one-content"
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      }}>
      <Text>Tab one</Text>
      {/* Push a suspending screen, then press tab two (native-urgent) to characterize interleaving. */}
      <Button
        testID="tab-push-slow"
        title="push /slow from tab"
        onPress={() => router.push('/slow')}
      />
    </View>
  );
}
