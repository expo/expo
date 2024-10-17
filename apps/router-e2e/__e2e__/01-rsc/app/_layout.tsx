import '../global.css';
import 'server-only';

import { Link, Slot } from 'expo-router';

import { unstable_styles } from '../home.module.css';
import { View, SafeAreaView } from '../lib/react-native';

const HomeLayout = (props) => {
  return (
    <SafeAreaView style={{ flex: 1 }} testID="layout-child-wrapper">
      <Slot />
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

      <View
        style={{
          flexDirection: 'row',
          padding: 12,

          justifyContent: 'space-around',
        }}>
        <Link href="/" style={props.path === '/' ? { color: 'blue' } : {}}>
          One
        </Link>
        <Link href="/second" style={props.path === '/second' ? { color: 'blue' } : {}}>
          Two
        </Link>
      </View>
    </SafeAreaView>
  );
};

export default HomeLayout;
