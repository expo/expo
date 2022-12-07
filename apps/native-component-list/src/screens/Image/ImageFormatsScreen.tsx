import { Image, ImageContentFit, ImageSource } from 'expo-image';
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
  Platform.OS === 'android' && {
    title: 'Base64',
    data: [
      {
        uri: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxNi4wLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB3aWR0aD0iMTI2cHgiIGhlaWdodD0iMTI2cHgiIHZpZXdCb3g9IjAgMCAxMjYgMTI2IiBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCAxMjYgMTI2IiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxnPg0KCTxyZWN0IHg9IjEuMDk1IiB5PSI5OC4yMjQiIHdpZHRoPSIxMjMuODEiIGhlaWdodD0iMTkuMjc1Ii8+DQoJPHJlY3QgeD0iMS4wOTUiIHk9Ijg1Ljc0IiB3aWR0aD0iMTIzLjgxIiBoZWlnaHQ9IjUuMjA1Ii8+DQoJPHBhdGggZD0iTTE4LjQwNCw5NS43MjFjMC43NjcsMCwxLjM4OS0wLjYyMywxLjM4OS0xLjM5cy0wLjYyMi0xLjM4OC0xLjM4OS0xLjM4OEgzLjQ4MWMtMC43NjcsMC0xLjM4OCwwLjYyMS0xLjM4OCwxLjM4OA0KCQlzMC42MjIsMS4zOSwxLjM4OCwxLjM5SDE4LjQwNHoiLz4NCgk8cGF0aCBkPSJNNDQuNDMzLDk1LjcyMWMwLjc2NywwLDEuMzg4LTAuNjIzLDEuMzg4LTEuMzlzLTAuNjIyLTEuMzg4LTEuMzg4LTEuMzg4SDI5LjUxYy0wLjc2NywwLTEuMzg5LDAuNjIxLTEuMzg5LDEuMzg4DQoJCXMwLjYyMiwxLjM5LDEuMzg5LDEuMzlINDQuNDMzeiIvPg0KCTxwYXRoIGQ9Ik03MC40NjEsOTUuNzIxYzAuNzY3LDAsMS4zODgtMC42MjMsMS4zODgtMS4zOXMtMC42MjItMS4zODgtMS4zODgtMS4zODhINTUuNTM5Yy0wLjc2NywwLTEuMzg4LDAuNjIxLTEuMzg4LDEuMzg4DQoJCXMwLjYyMiwxLjM5LDEuMzg4LDEuMzlINzAuNDYxeiIvPg0KCTxwYXRoIGQ9Ik05Ni40OSw5NS43MjFjMC43NjcsMCwxLjM4OS0wLjYyMywxLjM4OS0xLjM5cy0wLjYyMi0xLjM4OC0xLjM4OS0xLjM4OEg4MS41NjdjLTAuNzY3LDAtMS4zODgsMC42MjEtMS4zODgsMS4zODgNCgkJczAuNjIyLDEuMzksMS4zODgsMS4zOUg5Ni40OXoiLz4NCgk8cGF0aCBkPSJNMTIyLjUxOSw5NS43MjFjMC43NjcsMCwxLjM4OS0wLjYyMywxLjM4OS0xLjM5cy0wLjYyMi0xLjM4OC0xLjM4OS0xLjM4OGgtMTQuOTIzYy0wLjc2NywwLTEuMzg4LDAuNjIxLTEuMzg4LDEuMzg4DQoJCXMwLjYyMiwxLjM5LDEuMzg4LDEuMzlIMTIyLjUxOXoiLz4NCgk8cGF0aCBkPSJNNy40MSw4MC45aDUzLjQ0MmMwLjg2MywwLDEuNTYyLTAuNjk5LDEuNTYyLTEuNTYyVjM5LjU0M2MwLTAuODYyLTAuNjk5LTEuNTYzLTEuNTYyLTEuNTYzSDQ1LjMxNHYtNi41MzkNCgkJYzAtMC44NjEtMC42OTgtMS41NjItMS41NjEtMS41NjJIMjMuNDI4Yy0wLjg2MywwLTEuNTYyLDAuNy0xLjU2MiwxLjU2MnY2LjU0SDcuNDFjLTAuODYyLDAtMS41NjIsMC43LTEuNTYyLDEuNTYzdjM5Ljc5NQ0KCQlDNS44NDgsODAuMjAxLDYuNTQ3LDgwLjksNy40MSw4MC45eiBNMzQuNDkyLDU3Ljg3NGgtMS43OTZ2LTYuNzY4aDEuNzk2VjU3Ljg3NHogTTI2LjU2MywzNC41NzRoMTQuMDU1djMuNDA2SDI2LjU2M1YzNC41NzR6DQoJCSBNMTAuNTQ0LDQyLjY3OGg0Ny4xNzN2MTEuOThIMzYuOTQydi00LjAwNmMwLTAuODYzLTAuNjk5LTEuNTYzLTEuNTYyLTEuNTYzaC0zLjU4MmMtMC44NjMsMC0xLjU2MiwwLjY5OS0xLjU2MiwxLjU2M3Y0LjAwNg0KCQlIMTAuNTQ0VjQyLjY3OHoiLz4NCgk8cGF0aCBkPSJNNjguNzM0LDgwLjloNDkuOTU4YzAuODA3LDAsMS40Ni0wLjY1MywxLjQ2LTEuNDZWMTcuNTM0YzAtMC44MDYtMC42NTMtMS40NTktMS40Ni0xLjQ1OWgtMTQuNTI0VjkuOTYxDQoJCWMwLTAuODA3LTAuNjUzLTEuNDYtMS40Ni0xLjQ2aC0xOWMtMC44MDcsMC0xLjQ2LDAuNjUzLTEuNDYsMS40NnY2LjExNUg2OC43MzRjLTAuODA3LDAtMS40NiwwLjY1My0xLjQ2LDEuNDU5Vjc5LjQ0DQoJCUM2Ny4yNzQsODAuMjQ3LDY3LjkyNyw4MC45LDY4LjczNCw4MC45eiBNODYuNjM4LDEyLjg5aDEzLjEzOXYzLjE4Nkg4Ni42MzhWMTIuODl6Ii8+DQo8L2c+DQo8L3N2Zz4NCg==',
      },
    ],
  },
].filter(Boolean) as SectionListData<ImageSource>[];

function keyExtractor(item: any, index: number) {
  return '' + index;
}

function renderItem({ item }: SectionListRenderItemInfo<ImageSource>) {
  return <Image style={styles.image} contentFit={ImageContentFit.CONTAIN} source={item} />;
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
