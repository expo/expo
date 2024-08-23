import { useState } from 'react';
import { Button, View } from 'react-native';

import Actions from '../components/02-actions';
import LocalAsset from '../components/03-local-asset';
import Tailwind from '../components/04-tailwind';
import PublicAsset from '../components/05-public-asset';

export default function Page() {
  const [index, setIndex] = useState(0);
  return (
    <View style={{ flex: 1, padding: 56 }}>
      <Actions
        index={index}
        setIndexAsync={async (index) => setIndex(index)}
        showAlert={(time) => {
          alert('Hello, world! ' + time);
        }}
        throwError={() => {
          throw new Error('hey');
        }}
        getNativeSettings={async () => {
          return 'native setting';
        }}
      />
      <Button
        title={`Increment on native: ${index}`}
        onPress={() => setIndex((index) => index + 1)}
      />

      <LocalAsset />
      <PublicAsset />

      <Tailwind />
    </View>
  );
}
