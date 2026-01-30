import * as ExpoBrownfield from 'expo-brownfield';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton, Header } from '@/components';

const Navigation = () => {
  return (
    <SafeAreaView>
      <Header title="Navigation" />
      <ActionButton
        title="Pop to native"
        description="Instantly return to the native app"
        icon="corner-up-left"
        onPress={() => ExpoBrownfield.popToNative()}
      />
      <ActionButton
        title="Enable native back"
        description="Enable the native back button"
        icon="toggle-right"
        onPress={() => ExpoBrownfield.setNativeBackEnabled(true)}
      />
      <ActionButton
        title="Disable native back"
        description="Disable the native back button"
        icon="toggle-left"
        onPress={() => ExpoBrownfield.setNativeBackEnabled(false)}
      />
    </SafeAreaView>
  );
};

export default Navigation;
