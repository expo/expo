import Ionicons from '@expo/vector-icons/build/Ionicons';
import MaterialIcons from '@expo/vector-icons/build/MaterialIcons';
import { Assets as StackAssets } from '@react-navigation/stack';
import { Asset } from 'expo-asset';
import * as Font from 'expo-font';
import { Platform } from 'react-native';

async function loadAssetsAsync() {
  const promise = Font.loadAsync({
    'space-mono': require('../../assets/fonts/SpaceMono-Regular.ttf'),
  });
  promise.then((value) => {
    const asset = Asset.fromModule(require('../../assets/fonts/SpaceMono-Regular.ttf'));
    console.log('FONT LOADED: ', asset);
  });

  const assetPromises: Promise<any>[] = [
    Asset.loadAsync(StackAssets),
    Font.loadAsync(Ionicons.font),
    Font.loadAsync(MaterialIcons.font),
    promise,
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
