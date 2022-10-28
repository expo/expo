import { WithSkiaWeb } from '@shopify/react-native-skia/src/web';
import { version as CanvasKitVersion } from 'canvaskit-wasm/package.json';
import { Text } from 'react-native';

export default function SkiaScreen() {
  return (
    <WithSkiaWeb
      getComponent={() => {
        // @ts-ignore
        return import('./Breathe');
      }}
      fallback={<Text>Loading Skia...</Text>}
      opts={{
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/canvaskit-wasm@${CanvasKitVersion}/bin/full/${file}`,
      }}
    />
  );
}

SkiaScreen.navigationOptions = {
  title: 'Skia',
};
