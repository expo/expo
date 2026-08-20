import { Image, ImageSource, ImageTransition } from 'expo-image';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import Button from '../../components/Button';
import { FunctionParameter, useArguments } from '../../components/FunctionDemo';
import Configurator from '../../components/FunctionDemo/Configurator';
import { Colors } from '../../constants';

const generateSeed = () => 1 + Math.round(Math.random() * 10);

const parameters: FunctionParameter[] = [
  {
    name: 'Duration',
    type: 'enum',
    values: [
      { name: '0', value: 0 },
      { name: '300', value: 300 },
      { name: '2000', value: 2000 },
    ],
  },
  {
    name: 'Effect',
    type: 'enum',
    platforms: ['ios', 'web'],
    values: [
      { name: 'cross-dissolve (default)', value: 'cross-dissolve' },
      { name: 'flip-from-left', value: 'flip-from-left' },
      { name: 'flip-from-right', value: 'flip-from-right' },
      { name: 'flip-from-top', value: 'flip-from-top' },
      { name: 'flip-from-bottom', value: 'flip-from-bottom' },
      { name: 'curl-up', value: 'curl-up' },
      { name: 'curl-down', value: 'curl-down' },
      { name: 'none', value: null },
    ],
  },
  {
    name: 'Timing',
    type: 'enum',
    platforms: ['ios', 'web'],
    values: [
      { name: 'ease-in-out (default)', value: 'ease-in-out' },
      { name: 'ease-in', value: 'ease-in' },
      { name: 'ease-out', value: 'ease-out' },
      { name: 'linear', value: 'linear' },
    ],
  },
  {
    name: 'Skip on cache hit',
    type: 'enum',
    platforms: ['ios', 'android'],
    values: [
      { name: 'none (default)', value: 'none' },
      { name: 'memory', value: 'memory' },
      { name: 'all', value: 'all' },
    ],
  },
  {
    name: 'Use only fadeDuration',
    type: 'boolean',
    initial: false,
  },
];

export default function ImageTransitionsScreen() {
  const [source, setSource] = useState<ImageSource | null>({ uri: getRandomImageUri() });
  const [recycleCount, setRecycleCount] = useState(0);
  const [args, updateArgument] = useArguments(parameters);
  const [duration, effect, timing, skipOnCacheHit, onlyFadeDuration] = args as [
    ImageTransition['duration'],
    ImageTransition['effect'],
    ImageTransition['timing'],
    ImageTransition['skipOnCacheHit'],
    boolean,
  ];

  const changeImage = useCallback(() => {
    setSource({ uri: getRandomImageUri() });
  }, []);

  const recycle = useCallback(() => {
    const next = recycleCount + 1;
    setRecycleCount(next);
    setSource({ uri: getRecycledImageUri(next) });
  }, [recycleCount]);

  const transition = onlyFadeDuration ? null : { duration, effect, timing, skipOnCacheHit };

  return (
    <View style={styles.container}>
      <Image
        style={styles.image}
        source={source ?? []}
        recyclingKey={String(recycleCount)}
        transition={transition}
        fadeDuration={duration}
        cachePolicy="memory-disk"
      />

      <View style={styles.configurator}>
        <Button
          style={styles.actionButton}
          title="Change image (source change)"
          onPress={changeImage}
        />
        <Button style={styles.actionButton} title="Recycle view (cache hit)" onPress={recycle} />

        <Configurator parameters={parameters} onChange={updateArgument} value={args} />
      </View>
    </View>
  );
}

function getRandomImageUri(): string {
  return `https://picsum.photos/seed/${generateSeed()}/3000/2000`;
}

function getRecycledImageUri(count: number): string {
  return `https://picsum.photos/seed/recycle-${count % 2}/3000/2000`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  image: {
    height: 200,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  configurator: {
    alignItems: 'flex-start',
    padding: 10,
  },
  actionButton: {
    marginVertical: 8,
  },
});
