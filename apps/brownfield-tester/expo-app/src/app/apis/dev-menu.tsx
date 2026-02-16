import * as ExpoDevMenu from 'expo-dev-menu';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton, Header } from '@/components';

const DevMenu = () => {
  return (
    <SafeAreaView>
      <Header title="Dev Menu" />
      <ActionButton
        title="Open Dev Menu"
        description="Open the dev menu"
        icon="code"
        onPress={() => ExpoDevMenu.openMenu()}
        testID="dev-menu-open"
      />
    </SafeAreaView>
  );
};

export default DevMenu;
