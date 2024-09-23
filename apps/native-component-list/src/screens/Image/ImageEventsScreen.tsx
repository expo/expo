import { Image, ImageErrorEventData, ImageLoadEventData, ImageProgressEventData } from 'expo-image';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import Button from '../../components/Button';
import ConsoleBox from '../../components/ConsoleBox';
import { Colors } from '../../constants';

const generateSeed = () => 1 + Math.round(Math.random() * 2137);

export default function ImageEventsScreen() {
  const [uri, setSourceUri] = useState(getRandomImageUri());
  const [logs, setLogs] = useState<string[]>([]);

  const onLoadStart = useCallback(() => {
    logs.push('🚀 onLoadStart');
    setLogs([...logs]);
  }, [logs]);

  const onLoad = useCallback(
    (event: ImageLoadEventData) => {
      logs.push(`🚀 onLoad: ${JSON.stringify(event, null, 2)}`);
      setLogs([...logs]);
    },
    [logs]
  );

  const onProgress = useCallback(
    (event: ImageProgressEventData) => {
      logs.push(`🚀 onProgress: ${JSON.stringify(event, null, 2)}`);
      setLogs([...logs]);
    },
    [logs]
  );

  const onError = useCallback(
    (event: ImageErrorEventData) => {
      logs.push(`🚀 onError: ${JSON.stringify(event, null, 2)}`);
      setLogs([...logs]);
    },
    [logs]
  );

  const onLoadEnd = useCallback(() => {
    logs.push('🚀 onLoadEnd');
    setLogs([...logs]);
  }, [logs]);

  const onDisplay = useCallback(() => {
    logs.push('🚀 onDisplay');
    setLogs([...logs]);
  }, [logs]);

  const loadNewImage = useCallback(() => {
    setSourceUri(getRandomImageUri());
    setLogs([]);
  }, []);

  const loadWithError = useCallback(() => {
    setSourceUri(`https://expo.dev/?r=${generateSeed()}`);
    setLogs([]);
  }, []);

  return (
    <View style={styles.container}>
      <Image
        style={styles.image}
        source={{ uri }}
        onLoadStart={onLoadStart}
        onLoad={onLoad}
        onProgress={onProgress}
        onError={onError}
        onLoadEnd={onLoadEnd}
        onDisplay={onDisplay}
      />

      <View style={styles.buttons}>
        <Button title="Load new image" onPress={loadNewImage} />
        <Button title="Load with error" onPress={loadWithError} />
      </View>

      <ConsoleBox style={styles.logs}>{logs.join('\n')}</ConsoleBox>
    </View>
  );
}

function getRandomImageUri(): string {
  return `https://picsum.photos/seed/${generateSeed()}/3000/2000`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    height: 200,
    margin: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  logs: {
    flex: 1,
    margin: 20,
  },
});
