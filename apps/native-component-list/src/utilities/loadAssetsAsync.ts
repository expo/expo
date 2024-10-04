import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  Inter_600SemiBold,
  Inter_500Medium,
  Inter_800ExtraBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import { Assets as StackAssets } from '@react-navigation/elements';
import { Asset } from 'expo-asset';
import * as Font from 'expo-font';
import { Platform } from 'react-native';

async function loadAssetsAsync() {
  const assetPromises: Promise<any>[] = [
    Asset.loadAsync(StackAssets),
    Font.loadAsync(Ionicons.font),
    Font.loadAsync(MaterialIcons.font),
    Font.loadAsync({
      'space-mono': require('../../assets/fonts/SpaceMono-Regular.ttf'),
    }),
    Font.loadAsync({
      'Inter-Black': require('../../assets/fonts/Inter/Inter-Black.otf'),
      'Inter-BlackItalic': require('../../assets/fonts/Inter/Inter-BlackItalic.otf'),
      'Inter-Bold': require('../../assets/fonts/Inter/Inter-Bold.otf'),
      'Inter-BoldItalic': require('../../assets/fonts/Inter/Inter-BoldItalic.otf'),
      'Inter-ExtraBold': require('../../assets/fonts/Inter/Inter-ExtraBold.otf'),
      'Inter-ExtraBoldItalic': require('../../assets/fonts/Inter/Inter-ExtraBoldItalic.otf'),
      'Inter-ExtraLight': require('../../assets/fonts/Inter/Inter-ExtraLight.otf'),
      'Inter-ExtraLightItalic': require('../../assets/fonts/Inter/Inter-ExtraLightItalic.otf'),
      'Inter-Regular': require('../../assets/fonts/Inter/Inter-Regular.otf'),
      'Inter-Italic': require('../../assets/fonts/Inter/Inter-Italic.otf'),
      'Inter-Light': require('../../assets/fonts/Inter/Inter-Light.otf'),
      'Inter-LightItalic': require('../../assets/fonts/Inter/Inter-LightItalic.otf'),
      'Inter-Medium': require('../../assets/fonts/Inter/Inter-Medium.otf'),
      'Inter-MediumItalic': require('../../assets/fonts/Inter/Inter-MediumItalic.otf'),
      'Inter-SemiBold': require('../../assets/fonts/Inter/Inter-SemiBold.otf'),
      'Inter-SemiBoldItalic': require('../../assets/fonts/Inter/Inter-SemiBoldItalic.otf'),
      'Inter-Thin': require('../../assets/fonts/Inter/Inter-Thin.otf'),
      'Inter-ThinItalic': require('../../assets/fonts/Inter/Inter-ThinItalic.otf'),
      // Font's that did not load correctly for users in https://github.com/expo/expo/issues/29018
      'OpenSans_Condensed-SemiBold': require('../../assets/fonts/OpenSans/OpenSans_Condensed-SemiBold.ttf'),
      'OpenSans_Condensed-BoldItalic': require('../../assets/fonts/OpenSans/OpenSans_Condensed-BoldItalic.ttf'),
      'OpenSans-ExtraBoldItalic': require('../../assets/fonts/OpenSans/OpenSans-ExtraBoldItalic.ttf'),
      'OpenSans-Light': require('../../assets/fonts/OpenSans/OpenSans-Light.ttf'),
      'OpenSans-Medium': require('../../assets/fonts/OpenSans/OpenSans-Medium.ttf'),
      'OpenSans-SemiBold': require('../../assets/fonts/OpenSans/OpenSans-SemiBold.ttf'),
    }),
    Font.loadAsync({
      Inter_600SemiBold,
      Inter_500Medium,
      Inter_800ExtraBold,
      Inter_900Black,
    }),
  ];
  if (Platform.OS !== 'web') {
    assetPromises.push(
      Font.loadAsync({
        Roboto: 'https://github.com/google/fonts/raw/d1a2e0f/ofl/roboto/static/Roboto-Regular.ttf',
      })
    );
  }
  await Promise.all(assetPromises);
}

let oncePromise: Promise<void>;
export default function loadAssetsAsyncOnce() {
  oncePromise = oncePromise || loadAssetsAsync();
  return oncePromise;
}
