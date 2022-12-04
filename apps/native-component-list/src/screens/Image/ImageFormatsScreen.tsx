import { Image, ImageResizeMode, ImageSource } from 'expo-image';
import * as React from 'react';
import {
  SectionList,
  SectionListData,
  SectionListRenderItemInfo,
  StyleSheet,
  View,
  Platform,
} from 'react-native';

import HeadingText from '../../components/HeadingText';
import { Colors } from '../../constants';

const data: SectionListData<ImageSource>[] = [
  {
    title: 'Animated WebP',
    data: [
      {
        uri: 'https://mathiasbynens.be/demo/animated-webp-supported.webp',
      },
    ],
  },
  {
    title: 'Animated PNG (APNG)',
    data: [
      {
        uri: 'https://apng.onevcat.com/assets/elephant.png',
      },
    ],
  },
  {
    title: 'GIF',
    data: [
      {
        uri: 'https://apng.onevcat.com/assets/elephant.gif',
      },
    ],
  },
  {
    title: 'Animated AVIF',
    data: [
      {
        uri: 'https://colinbendell.github.io/webperf/animated-gif-decode/2.avif',
      },
    ],
  },
  {
    title: 'HEIC',
    data: [
      {
        uri: 'https://nokiatech.github.io/heif/content/images/ski_jump_1440x960.heic',
      },
    ],
  },
  {
    title: 'Animated HEIC',
    data: [
      {
        uri: 'https://nokiatech.github.io/heif/content/image_sequences/starfield_animation.heic',
      },
    ],
  },
  {
    title: 'JPEG',
    data: [
      {
        uri: 'https://picsum.photos/id/1069/700/466.jpg',
      },
    ],
  },
  {
    title: 'SVG',
    data: [
      {
        uri: 'https://icon-icons.com/downloadimage.php?id=98748&root=1446/SVG/&file=22221cat_98748.svg',
      },
    ],
  },
  {
    title: 'ICO',
    data: [
      {
        uri: 'https://icon-icons.com/downloadimage.php?id=132404&root=2148/ICO/512/&file=expo_icon_132404.ico',
      },
    ],
  },
  Platform.OS === 'ios' && {
    title: 'ICNS',
    data: [
      {
        uri: 'https://icon-icons.com/downloadimage.php?id=214748&root=3398/ICNS/512/&file=react_logo_icon_214748.icns',
      },
    ],
  },
].filter(Boolean) as SectionListData<ImageSource>[];

function keyExtractor(item: any, index: number) {
  return '' + index;
}

function renderItem({ item }: SectionListRenderItemInfo<ImageSource>) {
  return <Image style={styles.image} resizeMode={ImageResizeMode.CONTAIN} source={item} />;
}

function renderSectionHeader({ section }: { section: SectionListData<ImageSource> }) {
  return (
    <View style={styles.header}>
      <HeadingText style={styles.title}>{section.title}</HeadingText>
    </View>
  );
}

export default function ImageFormatsScreen() {
  return (
    <SectionList
      sections={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    marginVertical: 10,
    width: '100%',
    height: 160,
  },
  header: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.greyBackground,
    borderTopColor: Colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  title: {
    marginTop: -12,
  },
});
