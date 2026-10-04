import { Stack, Unmatched, useLocalSearchParams, useNavigation } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type ScreenConfig } from '../types/ScreenConfig';
import { SearchToolbar } from './StackConfig';

/**
 * Renders a registry screen resolved from a catch-all route segment
 * (e.g. `/components/image/comparison` → the `image/comparison` screen).
 * Used by the `[...id]` routes in this app and in bare-expo.
 */
export default function RegistryScreenRoute({
  findScreen,
}: {
  findScreen: (id: string) => ScreenConfig | undefined;
}) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { id, ...params } = useLocalSearchParams<{ id: string[] }>();
  const screenId = Array.isArray(id) ? id.join('/') : id;
  const config = screenId ? findScreen(screenId) : undefined;
  const Component = React.useMemo(() => config?.getComponent(), [config]) as
    | React.ComponentType<object>
    | undefined;

  if (!config || !Component) {
    return <Unmatched />;
  }
  return (
    <>
      <Stack.Screen options={{ title: config.name, ...config.options }} />
      <SearchToolbar />
      {/* Horizontal insets are asymmetric where the system puts bars on one side, such as iPhone Duo. */}
      <View style={{ flex: 1, paddingLeft: insets.left, paddingRight: insets.right }}>
        {/* Pass react-navigation style props for screens that still read them. */}
        <Component {...{ navigation, route: { params } }} />
      </View>
    </>
  );
}
