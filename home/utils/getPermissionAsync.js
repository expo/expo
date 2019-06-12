import { Permissions } from 'expo';
import { Alert, Linking } from 'react-native';

export default async function getPermissionAsync(permission, prompt) {
  const { status } = await Permissions.askAsync(permission);
  if (status !== 'granted') {
    // Check if the settings can be opened.
    if (await Linking.canOpenURL('app-settings:')) {
      // Prompt to open settings and change the permission manually.
      // When the user changes the permissions the app will reset so we should
      // just return false regardless at this point.
      return new Promise(resolve => {
        Alert.alert(
          'Oh no!',
          prompt,
          [
            {
              text: 'Open Settings',
              onPress: async () => {
                await Linking.openURL('app-settings:');
                resolve(false);
              },
            },
            {
              text: 'Nevermind',
              onPress: () => resolve(false),
              style: 'cancel',
            },
          ],
          { cancelable: true }
        );
      });
    }
    // TODO: Bacon: Maybe unify alerts here
    return false;
  }
  return true;
}
