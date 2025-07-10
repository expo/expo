import { Image, ImageProps } from 'expo-image';
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

const data: SectionListData<ImageProps>[] = [
  {
    title: 'Animated WebP',
    data: [
      {
        source: 'https://mathiasbynens.be/demo/animated-webp-supported.webp',
      },
    ],
  },
  Platform.OS === 'ios' && {
    title: 'Animated WebP (useAppleWebpCodec: false)',
    data: [
      {
        source: 'https://iili.io/JEBYMvV.webp',
        useAppleWebpCodec: false,
      },
    ],
  },
  {
    title: 'Animated PNG (APNG)',
    data: [
      {
        source: 'https://apng.onevcat.com/assets/elephant.png',
      },
    ],
  },
  {
    title: 'GIF',
    data: [
      {
        source: 'https://apng.onevcat.com/assets/elephant.gif',
      },
    ],
  },
  {
    title: 'Animated AVIF',
    data: [
      {
        source: 'https://colinbendell.github.io/webperf/animated-gif-decode/2.avif',
      },
    ],
  },
  {
    title: 'HEIC',
    data: [
      {
        source: 'https://nokiatech.github.io/heif/content/images/ski_jump_1440x960.heic',
      },
    ],
  },
  {
    title: 'Animated HEIC',
    data: [
      {
        source: 'https://nokiatech.github.io/heif/content/image_sequences/starfield_animation.heic',
      },
    ],
  },
  {
    title: 'JPEG',
    data: [
      {
        source: 'https://picsum.photos/id/1069/700/466.jpg',
      },
    ],
  },
  {
    title: 'JPEG (base64)',
    data: [
      {
        source:
          'data:image/jpeg;base64,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',
      },
    ],
  },
  {
    title: 'SVG',
    data: [
      {
        source: 'https://static.expo.dev/static/images/bimi-default.svg',
      },
    ],
  },
  {
    title: 'SVG (base64)',
    data: [
      {
        source:
          'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxNi4wLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB3aWR0aD0iMTI2cHgiIGhlaWdodD0iMTI2cHgiIHZpZXdCb3g9IjAgMCAxMjYgMTI2IiBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCAxMjYgMTI2IiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxnPg0KCTxyZWN0IHg9IjEuMDk1IiB5PSI5OC4yMjQiIHdpZHRoPSIxMjMuODEiIGhlaWdodD0iMTkuMjc1Ii8+DQoJPHJlY3QgeD0iMS4wOTUiIHk9Ijg1Ljc0IiB3aWR0aD0iMTIzLjgxIiBoZWlnaHQ9IjUuMjA1Ii8+DQoJPHBhdGggZD0iTTE4LjQwNCw5NS43MjFjMC43NjcsMCwxLjM4OS0wLjYyMywxLjM4OS0xLjM5cy0wLjYyMi0xLjM4OC0xLjM4OS0xLjM4OEgzLjQ4MWMtMC43NjcsMC0xLjM4OCwwLjYyMS0xLjM4OCwxLjM4OA0KCQlzMC42MjIsMS4zOSwxLjM4OCwxLjM5SDE4LjQwNHoiLz4NCgk8cGF0aCBkPSJNNDQuNDMzLDk1LjcyMWMwLjc2NywwLDEuMzg4LTAuNjIzLDEuMzg4LTEuMzlzLTAuNjIyLTEuMzg4LTEuMzg4LTEuMzg4SDI5LjUxYy0wLjc2NywwLTEuMzg5LDAuNjIxLTEuMzg5LDEuMzg4DQoJCXMwLjYyMiwxLjM5LDEuMzg5LDEuMzlINDQuNDMzeiIvPg0KCTxwYXRoIGQ9Ik03MC40NjEsOTUuNzIxYzAuNzY3LDAsMS4zODgtMC42MjMsMS4zODgtMS4zOXMtMC42MjItMS4zODgtMS4zODgtMS4zODhINTUuNTM5Yy0wLjc2NywwLTEuMzg4LDAuNjIxLTEuMzg4LDEuMzg4DQoJCXMwLjYyMiwxLjM5LDEuMzg4LDEuMzlINzAuNDYxeiIvPg0KCTxwYXRoIGQ9Ik05Ni40OSw5NS43MjFjMC43NjcsMCwxLjM4OS0wLjYyMywxLjM4OS0xLjM5cy0wLjYyMi0xLjM4OC0xLjM4OS0xLjM4OEg4MS41NjdjLTAuNzY3LDAtMS4zODgsMC42MjEtMS4zODgsMS4zODgNCgkJczAuNjIyLDEuMzksMS4zODgsMS4zOUg5Ni40OXoiLz4NCgk8cGF0aCBkPSJNMTIyLjUxOSw5NS43MjFjMC43NjcsMCwxLjM4OS0wLjYyMywxLjM4OS0xLjM5cy0wLjYyMi0xLjM4OC0xLjM4OS0xLjM4OGgtMTQuOTIzYy0wLjc2NywwLTEuMzg4LDAuNjIxLTEuMzg4LDEuMzg4DQoJCXMwLjYyMiwxLjM5LDEuMzg4LDEuMzlIMTIyLjUxOXoiLz4NCgk8cGF0aCBkPSJNNy40MSw4MC45aDUzLjQ0MmMwLjg2MywwLDEuNTYyLTAuNjk5LDEuNTYyLTEuNTYyVjM5LjU0M2MwLTAuODYyLTAuNjk5LTEuNTYzLTEuNTYyLTEuNTYzSDQ1LjMxNHYtNi41MzkNCgkJYzAtMC44NjEtMC42OTgtMS41NjItMS41NjEtMS41NjJIMjMuNDI4Yy0wLjg2MywwLTEuNTYyLDAuNy0xLjU2MiwxLjU2MnY2LjU0SDcuNDFjLTAuODYyLDAtMS41NjIsMC43LTEuNTYyLDEuNTYzdjM5Ljc5NQ0KCQlDNS44NDgsODAuMjAxLDYuNTQ3LDgwLjksNy40MSw4MC45eiBNMzQuNDkyLDU3Ljg3NGgtMS43OTZ2LTYuNzY4aDEuNzk2VjU3Ljg3NHogTTI2LjU2MywzNC41NzRoMTQuMDU1djMuNDA2SDI2LjU2M1YzNC41NzR6DQoJCSBNMTAuNTQ0LDQyLjY3OGg0Ny4xNzN2MTEuOThIMzYuOTQydi00LjAwNmMwLTAuODYzLTAuNjk5LTEuNTYzLTEuNTYyLTEuNTYzaC0zLjU4MmMtMC44NjMsMC0xLjU2MiwwLjY5OS0xLjU2MiwxLjU2M3Y0LjAwNg0KCQlIMTAuNTQ0VjQyLjY3OHoiLz4NCgk8cGF0aCBkPSJNNjguNzM0LDgwLjloNDkuOTU4YzAuODA3LDAsMS40Ni0wLjY1MywxLjQ2LTEuNDZWMTcuNTM0YzAtMC44MDYtMC42NTMtMS40NTktMS40Ni0xLjQ1OWgtMTQuNTI0VjkuOTYxDQoJCWMwLTAuODA3LTAuNjUzLTEuNDYtMS40Ni0xLjQ2aC0xOWMtMC44MDcsMC0xLjQ2LDAuNjUzLTEuNDYsMS40NnY2LjExNUg2OC43MzRjLTAuODA3LDAtMS40NiwwLjY1My0xLjQ2LDEuNDU5Vjc5LjQ0DQoJCUM2Ny4yNzQsODAuMjQ3LDY3LjkyNyw4MC45LDY4LjczNCw4MC45eiBNODYuNjM4LDEyLjg5aDEzLjEzOXYzLjE4Nkg4Ni42MzhWMTIuODl6Ii8+DQo8L2c+DQo8L3N2Zz4NCg==',
      },
    ],
  },
  {
    title: 'ICO',
    data: [
      {
        source: 'https://snack.expo.dev/favicon.ico',
      },
    ],
  },
  Platform.OS === 'ios' && {
    title: 'ICNS',
    data: [
      {
        source:
          'https://github.com/tinalatif/flat.icns/raw/refs/heads/master/icns/google%20chromium.icns',
      },
    ],
  },
].filter(Boolean) as SectionListData<ImageProps>[];

function keyExtractor(item: any, index: number) {
  return '' + index;
}

function renderItem({ item }: SectionListRenderItemInfo<ImageProps>) {
  return <Image style={styles.image} contentFit="contain" {...item} />;
}

function renderSectionHeader({ section }: { section: SectionListData<ImageProps> }) {
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
