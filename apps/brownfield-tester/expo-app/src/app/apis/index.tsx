import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '@/components';

type Screen = 'communication' | 'dev-menu' | 'navigation' | 'state';

const Index = () => {
  const router = useRouter();

  const navigateToScreen = (screen: Screen) => {
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
        testID="apis-communication"
      />
      <ActionButton
        type="link"
        icon="navigation"
        title="Navigation"
        description="Navigation API"
        onPress={() => navigateToScreen('navigation')}
        testID="apis-navigation"
      />
      <ActionButton
        type="link"
        icon="database"
        title="State"
        description="State API"
        onPress={() => navigateToScreen('state')}
        testID="apis-state"
      />
      <ActionButton
        type="link"
        icon="code"
        title="Dev Menu"
        description="Dev Menu API"
        onPress={() => navigateToScreen('dev-menu')}
        testID="apis-dev-menu"
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
