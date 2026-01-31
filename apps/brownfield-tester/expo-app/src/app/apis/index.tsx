import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '@/components';

const Index = () => {
  const router = useRouter();

  const navigateToScreen = (screen: 'communication' | 'navigation') => {
    router.navigate(`/apis/${screen}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ActionButton
        type="link"
        icon="message-circle"
        title="Communication"
        description="Bi-directional communication API"
        onPress={() => navigateToScreen('communication')}
      />
      <ActionButton
        type="link"
        icon="navigation"
        title="Navigation"
        description="Navigation API"
        onPress={() => navigateToScreen('navigation')}
      />
    </SafeAreaView>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
