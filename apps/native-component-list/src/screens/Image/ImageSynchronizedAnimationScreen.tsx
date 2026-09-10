import { useTheme } from 'ThemeProvider';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import { ScrollPage } from '../../components/Page';
import TitledSwitch from '../../components/TitledSwitch';

const animatedImage = 'https://cdn.7tv.app/emote/01F9DGR2YG000E7SC8F959BREV/4x.gif';

const copies = 3;
const staggerMs = 500; // represents rendering at different times

export default function ImageSynchronizedAnimationScreen() {
  const { theme } = useTheme();
  const [synchronizedAnimation, setSynchronizedAnimation] = useState(true);
  const [generation, setGeneration] = useState(0);
  const [staggered, setStaggered] = useState(false);

  const remount = (nextStaggered: boolean) => {
    setStaggered(nextStaggered);
    setGeneration((value) => value + 1);
  };

  return (
    <ScrollPage>
      <Text style={[styles.hint, { color: theme.text.secondary }]}>
        All images below load the same animated image. With synchronizedAnimation on, they show the
        same frame no matter when they were rendered. Turn it off and press "Staggered remount" to
        see them drift apart.
      </Text>
      <TitledSwitch
        title="synchronizedAnimation"
        value={synchronizedAnimation}
        setValue={setSynchronizedAnimation}
      />
      <View style={styles.buttons}>
        <Button title="Remount" onPress={() => remount(false)} />
        <Button title="Staggered remount" onPress={() => remount(true)} />
      </View>
      <View style={styles.grid}>
        {Array.from({ length: copies }, (_, index) => (
          <ImageCell
            key={`${generation}:${index}`}
            delayMs={staggered ? index * staggerMs : 0}
            synchronizedAnimation={synchronizedAnimation}
          />
        ))}
      </View>
    </ScrollPage>
  );
}

type ImageCellProps = {
  delayMs: number;
  synchronizedAnimation: boolean;
};

function ImageCell({ delayMs, synchronizedAnimation }: ImageCellProps) {
  const [visible, setVisible] = useState(delayMs === 0);

  useEffect(() => {
    if (delayMs === 0) {
      return;
    }
    const timeout = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(timeout);
  }, [delayMs]);

  if (!visible) {
    return <View style={styles.imageCell} />;
  }

  return (
    <Image
      style={styles.imageCell}
      source={{ uri: animatedImage }}
      synchronizedAnimation={synchronizedAnimation}
    />
  );
}

const styles = StyleSheet.create({
  hint: {
    marginTop: 12,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageCell: {
    width: 100,
    height: 100,
  },
});
