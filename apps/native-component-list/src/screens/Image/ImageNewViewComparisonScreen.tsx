import { Image, ImageContentFit, ImageProps, useImage } from 'expo-image';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import { Colors } from '../../constants';
import { images } from './images';

// Compares the current iOS image view with the new one, which the internal `experimental_useV2View` prop selects.

type Case = {
  title: string;
  props: ImageProps;
};

const REMOTE_JPEGS = [
  { uri: 'https://picsum.photos/seed/expo/1200/800' },
  { uri: 'https://picsum.photos/seed/expo-swapped/1200/800' },
];
// Both images have the same size, so the two refs have the same enumerable values.
const REMOTE_JPEGS_FOR_REF = [
  { uri: 'https://picsum.photos/seed/expo-ref/900/600' },
  { uri: 'https://picsum.photos/seed/expo-ref-swapped/900/600' },
];
const REMOTE_GIF = { uri: 'https://media2.giphy.com/media/Q6WPVzFU8LcBWWgQE1/giphy.gif' };

function getCases(remoteJpeg: ImageProps['source']): Case[] {
  return [
    { title: 'Remote JPEG', props: { source: remoteJpeg } },
    { title: 'Local PNG with transparency', props: { source: images.require_png } },
    { title: 'Remote animated GIF', props: { source: REMOTE_GIF } },
    { title: 'Local animated WebP', props: { source: images.require_webp_anim } },
    {
      title: 'Content position: top left',
      props: { source: remoteJpeg, contentPosition: 'top left' },
    },
    {
      title: 'Content position: right 10, bottom 25%',
      props: { source: remoteJpeg, contentPosition: { right: 10, bottom: '25%' } },
    },
    {
      title: 'Border radius',
      props: { source: remoteJpeg, style: { borderRadius: 24 } },
    },
    {
      title: 'Border radius and border width',
      props: {
        source: remoteJpeg,
        style: { borderRadius: 24, borderWidth: 4, borderColor: 'tomato' },
      },
    },
    { title: 'Error (missing image)', props: { source: { uri: 'https://expo.dev/missing.png' } } },
  ];
}

const CONTENT_FITS: ImageContentFit[] = ['cover', 'contain', 'fill', 'none', 'scale-down'];

export default function ImageNewViewComparisonScreen() {
  const [contentFit, setContentFit] = useState<ImageContentFit>('cover');
  const [opacity, setOpacity] = useState(1);
  const [mountKey, setMountKey] = useState(0);
  const [jpegIndex, setJpegIndex] = useState(0);
  const [transition, setTransition] = useState(0);
  const [refIndex, setRefIndex] = useState(0);
  const firstImageRef = useImage(REMOTE_JPEGS_FOR_REF[0]);
  const secondImageRef = useImage(REMOTE_JPEGS_FOR_REF[1]);
  const imageRef = refIndex === 0 ? firstImageRef : secondImageRef;
  const cases = useMemo<Case[]>(() => {
    const cases = getCases(REMOTE_JPEGS[jpegIndex]);
    return imageRef
      ? [{ title: 'Image ref from useImage', props: { source: imageRef } }, ...cases]
      : cases;
  }, [imageRef, jpegIndex]);

  const nextContentFit = useCallback(() => {
    setContentFit(CONTENT_FITS[(CONTENT_FITS.indexOf(contentFit) + 1) % CONTENT_FITS.length]);
  }, [contentFit]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.buttons}>
        <Button title={`contentFit: ${contentFit}`} onPress={nextContentFit} />
        <Button title={`opacity: ${opacity}`} onPress={() => setOpacity(opacity === 1 ? 0.5 : 1)} />
        <Button title="Swap remote JPEG" onPress={() => setJpegIndex(jpegIndex === 0 ? 1 : 0)} />
        <Button title="Swap image ref" onPress={() => setRefIndex(refIndex === 0 ? 1 : 0)} />
        <Button
          title={`transition: ${transition}`}
          onPress={() => setTransition(transition === 0 ? 1000 : 0)}
        />
        <Button title="Remount" onPress={() => setMountKey(mountKey + 1)} />
      </View>
      <Text style={styles.hint}>
        Each row renders the same props with the current view (left) and the new view (right). The
        event log shows the events of each view since the last remount.
      </Text>
      {cases.map((item) => (
        <View key={`${item.title}-${mountKey}`} style={styles.case}>
          <Text style={styles.caseTitle}>{item.title}</Text>
          <View style={styles.row}>
            <ComparisonCell
              title="Current"
              props={item.props}
              contentFit={contentFit}
              opacity={opacity}
              transition={transition}
            />
            <ComparisonCell
              title="New"
              useV2View
              props={item.props}
              contentFit={contentFit}
              opacity={opacity}
              transition={transition}
            />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function ComparisonCell({
  title,
  useV2View = false,
  props,
  contentFit,
  opacity,
  transition,
}: {
  title: string;
  useV2View?: boolean;
  props: ImageProps;
  contentFit: ImageContentFit;
  opacity: number;
  transition: number;
}) {
  const startTime = useRef(Date.now());
  const [events, setEvents] = useState<string[]>([]);

  const log = useCallback((event: string) => {
    const time = Date.now() - startTime.current;
    setEvents((events) => [...events, `${time}ms ${event}`]);
  }, []);

  return (
    <View style={styles.cell} testID={`${title}-cell`}>
      <Text style={styles.cellTitle}>{title}</Text>
      <Image
        {...props}
        experimental_useV2View={useV2View}
        contentFit={contentFit}
        transition={transition}
        style={[styles.image, props.style, { opacity }]}
        onLoadStart={() => log('loadStart')}
        onLoad={(event) =>
          log(
            `load ${event.cacheType} ${Math.round(event.source.width)}x${Math.round(event.source.height)}${event.source.isAnimated ? ' animated' : ''}`
          )
        }
        onError={(event) => log(`error ${event.error}`)}
        onDisplay={() => log('display')}
      />
      <Text style={styles.events}>{events.join('\n')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 12,
    gap: 16,
  },
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hint: {
    color: Colors.secondaryText,
    fontSize: 12,
  },
  case: {
    gap: 6,
  },
  caseTitle: {
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  cell: {
    flex: 1,
    gap: 4,
  },
  cellTitle: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  image: {
    height: 120,
    backgroundColor: Colors.border,
  },
  events: {
    fontFamily: 'Menlo',
    fontSize: 10,
  },
});
