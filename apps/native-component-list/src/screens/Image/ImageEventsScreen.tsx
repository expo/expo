import {
  Image,
  ImageErrorEventData,
  ImageLoadEventData,
  ImageProgressEventData,
  ImageSource,
} from 'expo-image';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import Button from '../../components/Button';
import ConsoleBox from '../../components/ConsoleBox';
import { E2EKeyValueBox } from '../../components/E2EKeyValueBox';
import { Colors } from '../../constants';
import { images } from './images';

type ImageEventName =
  | 'onLoadStart'
  | 'onProgress'
  | 'onLoad'
  | 'onError'
  | 'onLoadEnd'
  | 'onDisplay';

const initialCounts: Record<ImageEventName, number> = {
  onLoadStart: 0,
  onProgress: 0,
  onLoad: 0,
  onError: 0,
  onLoadEnd: 0,
  onDisplay: 0,
};

// Bundled images keep the e2e events test independent from the network.
const localSources = [images.require_jpg1, images.require_png];

const generateSeed = () => 1 + Math.round(Math.random() * 2137);

export default function ImageEventsScreen() {
  const [source, setSource] = useState<ImageSource | number | null>(null);
  const [localIndex, setLocalIndex] = useState(0);
  const [counts, setCounts] = useState(initialCounts);
  const [lastLoad, setLastLoad] = useState<ImageLoadEventData | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  function record(name: ImageEventName, payload?: object) {
    setCounts((counts) => ({ ...counts, [name]: counts[name] + 1 }));
    setLogs((logs) => [
      ...logs,
      payload ? `🚀 ${name}: ${JSON.stringify(payload, null, 2)}` : `🚀 ${name}`,
    ]);
  }

  function onLoad(event: ImageLoadEventData) {
    setLastLoad(event);
    record('onLoad', event);
  }

  function changeSource(source: ImageSource | number) {
    setSource(source);
    setCounts(initialCounts);
    setLastLoad(null);
    setLogs([]);
  }

  function loadLocalImage() {
    changeSource(localSources[localIndex]);
    setLocalIndex((index) => (index + 1) % localSources.length);
  }

  function loadRemoteImage() {
    changeSource({ uri: `https://picsum.photos/seed/${generateSeed()}/3000/2000` });
  }

  function loadWithError() {
    changeSource({ uri: `https://expo.dev/?r=${generateSeed()}` });
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.container}>
      <Image
        style={styles.image}
        source={source}
        onLoadStart={() => record('onLoadStart')}
        onLoad={onLoad}
        onProgress={(event: ImageProgressEventData) => record('onProgress', event)}
        onError={(event: ImageErrorEventData) => record('onError', event)}
        onLoadEnd={() => record('onLoadEnd')}
        onDisplay={() => record('onDisplay')}
      />

      <View style={styles.buttons}>
        <Button title="Local image" onPress={loadLocalImage} />
        <Button title="Remote image" onPress={loadRemoteImage} />
        <Button title="Broken URL" onPress={loadWithError} />
      </View>

      <E2EKeyValueBox
        title="Events since the last source change"
        entries={{
          ...counts,
          cacheType: lastLoad?.cacheType,
          width: lastLoad?.source.width,
          height: lastLoad?.source.height,
          mediaType: lastLoad?.source.mediaType,
        }}
      />

      <ConsoleBox>{logs.join('\n')}</ConsoleBox>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 12,
  },
  image: {
    height: 200,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
  },
});
