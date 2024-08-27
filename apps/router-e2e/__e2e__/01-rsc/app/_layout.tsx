import 'server-only';

import { View } from '../lib/react-native';

import '../global.css';
import { unstable_styles } from '../home.module.css';

const HomeLayout = (props) => {
  return (
    <View style={{ flex: 1, padding: 12 }} testID="layout-child-wrapper">
      {props.children}
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
