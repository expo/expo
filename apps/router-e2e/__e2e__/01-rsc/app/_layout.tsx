import 'server-only';
import { Children } from 'expo-router/build/rsc/router/host';

import { View } from '../lib/react-native';

const HomeLayout = () => {
  return (
    <View style={{ flex: 1, padding: 12 }} testID="layout-child-wrapper">
      <Children />
    </View>
  );
};

export default HomeLayout;
