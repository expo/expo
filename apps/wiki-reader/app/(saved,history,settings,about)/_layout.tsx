import { Host, Icon, IconButton } from '@expo/ui/jetpack-compose';
import { DrawerActions } from '@react-navigation/native';
import { Stack, useSegments } from 'expo-router';

export default function Layout() {
  const segments = useSegments();
  const initialRouteName = (segments[0] as string)?.replace(/[()]/g, '');

  return (
    <Stack
      initialRouteName={initialRouteName}
      screenOptions={({ route, navigation }) => {
        const state = navigation.getState();
        const isRoot = state.routes[0]?.key === route.key;
        if (!isRoot) {
          return {};
        }
        return {
          headerLeft: () => (
            <Host matchContents>
              <IconButton onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
                <Icon source={require('@/assets/symbols/menu.xml')} tintColor="black" />
              </IconButton>
            </Host>
          ),
        };
      }}
    />
  );
}
