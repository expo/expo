import { Slot, ErrorBoundary } from 'expo-router';
import Head from 'expo-router/head';
import { View, Text } from 'react-native';

/*
 * These 3 exports would normally break FastRefresh, as they do not follow the rules defined here:
 *   https://reactnative.dev/docs/fast-refresh
 *
 * However, Expo Router monkey-patches the ReactRefresh.isLikelyComponent() function to accept these exports
 */
export const unstable_settings = {};
export { ErrorBoundary };
export function generateStaticParams() {
  return [];
}

export default function Layout() {
  const layoutValue = 'LAYOUT_VALUE';
  return (
    <>
      <Head>
        <meta name="expo-nested-layout" content={layoutValue} />
      </Head>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text testID="layout-value">{layoutValue}</Text>
        <Slot />
      </View>
    </>
  );
}
