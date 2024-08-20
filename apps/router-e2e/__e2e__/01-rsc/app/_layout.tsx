import 'server-only';
import { Children } from 'expo-router/build/rsc/router/host';

import { View } from '../lib/react-native';

import '../global.css';
import { unstable_styles } from '../home.module.css';

const HomeLayout = () => {
  return (
    <View style={{ flex: 1, padding: 12 }} testID="layout-child-wrapper">
      <Children />
      <View
        testID="layout-global-style"
        style={[
          { width: 100, height: 100 },
          { $$css: true, _: 'custom-global-style' },
        ]}
      />
      <View
        testID="layout-module-style"
        style={[{ width: 100, height: 100 }, unstable_styles.container]}
      />
    </View>
  );
};

export default HomeLayout;
