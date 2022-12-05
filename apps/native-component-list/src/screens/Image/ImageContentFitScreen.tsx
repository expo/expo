import { Image, ImageContentFit, ImageContentPosition } from 'expo-image';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import HeadingText from '../../components/HeadingText';
import { Colors } from '../../constants';

const CONTENT_FITS = [
  ImageContentFit.COVER,
  ImageContentFit.CONTAIN,
  ImageContentFit.FILL,
  ImageContentFit.NONE,
  ImageContentFit.SCALE_DOWN,
];

type ContentFitExample = {
  size: [number, number];
  position?: ImageContentPosition;
};

const EXAMPLES: ContentFitExample[] = [
  {
    size: [1500, 1000],
  },
  {
    size: [300, 200],
  },
  {
    size: [200, 300],
  },
  {
    size: [240, 160],
    position: { top: 10, left: 20 },
  },
  {
    size: [240, 160],
    position: { top: 0, right: 0 },
  },
  {
    size: [240, 160],
    position: { bottom: 5, left: 10 },
  },
  {
    size: [240, 160],
    position: { bottom: '10%', right: '10%' },
  },
  {
    size: [240, 160],
    position: { left: '15%' },
  },
  {
    size: [240, 160],
    position: { top: '-50%', right: '10%' },
  },
];

function sourceWithSize(size: [number, number]): string {
  return `https://picsum.photos/seed/138/${size[0]}/${size[1]}`;
}

function renderExample(contentFit: ImageContentFit, example: ContentFitExample, index: number) {
  const sizeText = example.size.join(' x ');
  const positionText = example.position
    ? JSON.stringify(example.position).replaceAll(/[{}"]/g, '').replaceAll(/[:,]/g, ' ')
    : null;

  return (
    <View key={index} style={styles.imageContainer}>
      <Image
        style={styles.image}
        source={{ uri: sourceWithSize(example.size) }}
        contentFit={contentFit}
        contentPosition={example.position}
      />
      <Text style={styles.description}>{[sizeText, positionText].filter(Boolean).join('\n')}</Text>
    </View>
  );
}

function renderContentFitExamples(contentFit: ImageContentFit, index: number) {
  return (
    <View key={index} style={styles.contentFitExamples}>
      <HeadingText style={styles.headingText}>{`Content fit: "${contentFit}"`}</HeadingText>
      <ScrollView style={styles.examplesScrollView} horizontal indicatorStyle="black">
        {EXAMPLES.map((example, index) => renderExample(contentFit, example, index))}
      </ScrollView>
    </View>
  );
}

export default function ImageContentFitScreen() {
  return (
    <ScrollView style={styles.container}>
      <HeadingText style={styles.headingText}>Full-size image</HeadingText>
      <Image style={styles.fullImageExample} source={{ uri: sourceWithSize([1500, 1000]) }} />
      <Text style={styles.description}>1500 x 1000</Text>

      {CONTENT_FITS.map(renderContentFitExamples)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentFitExamples: {
    backgroundColor: Colors.greyBackground,
    borderTopColor: Colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  fullImageExample: {
    width: 300,
    height: 200,
    margin: 10,
    alignSelf: 'center',
  },
  headingText: {
    marginTop: -6,
    marginBottom: 6,
    marginHorizontal: 10,
  },
  examplesScrollView: {
    padding: 10,
  },
  imageContainer: {
    marginRight: 15,
    alignItems: 'center',
  },
  image: {
    width: 100,
    height: 100,
    borderColor: Colors.tintColor,
    borderWidth: 1,
  },
  description: {
    padding: 5,
    fontSize: 11,
    textAlign: 'center',
  },
});
