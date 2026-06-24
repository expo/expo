import { useNavigation } from '@react-navigation/native';

import { useAppIntentsNavigationContext } from './AppIntentsNavigationHandler';
import Button from '../../components/Button';

export function AppIntentExitButton() {
  const navigation = useNavigation<any>();
  const appIntentsNavigation = useAppIntentsNavigationContext();

  const onPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    const didNavigate = appIntentsNavigation?.navigateToInitialAppScreen();
    if (!appIntentsNavigation || didNavigate === false) {
      navigation.navigate('ExpoApis');
    }
  };

  return <Button title="Back" onPress={onPress} />;
}
