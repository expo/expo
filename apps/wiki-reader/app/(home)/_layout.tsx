import { background, Host, Icon, IconButton, padding, SearchBar } from '@expo/ui/jetpack-compose';
import { DrawerActions } from '@react-navigation/native';
import { Stack, useNavigation } from 'expo-router';

export default function Layout() {
  const navigation = useNavigation();

  return (
    <Stack
      screenOptions={{
        headerLeft: () => (
          <Host matchContents>
            <IconButton onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
              <Icon source={require('../../assets/symbols/menu.xml')} tintColor="black" />
            </IconButton>
          </Host>
        ),
        headerRight: () => (
          <Host matchContents>
            <IconButton variant="bordered" onPress={() => alert('Shuffle')}>
              <Icon source={require('../../assets/symbols/shuffle.xml')} tintColor="#1d1b20" />
            </IconButton>
          </Host>
        ),
        headerTitle: () => (
          <Host
            style={{
              height: 56,
              marginHorizontal: 16,
            }}>
            <SearchBar />
          </Host>
        ),
        headerShadowVisible: false,
      }}
    />
  );
}
