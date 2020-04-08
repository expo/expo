---
title: ViewPager
sourceCodeUrl: 'https://github.com/react-native-community/react-native-viewpager'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import Video from '../../../../components/plugins/Video'

**`@react-native-community/viewpager`** exposes a component that provides the layout and gestures to scroll between pages of content, like a carousel.

<Video file={"sdk/viewpager.mp4"} loop={"false"}/>

<PlatformsSection android emulator ios simulator />

## Installation

<InstallSection packageName="@react-native-community/viewpager" href="https://github.com/react-native-community/react-native-viewpager#linking" />

## Usage

See full documentation at [react-native-community/react-native-viewpager](https://github.com/react-native-community/react-native-viewpager).

## Basic Example

```js
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import ViewPager from '@react-native-community/viewpager';

const MyPager = () => {
  return (
    <View style={{ flex: 1 }}>
      <ViewPager style={styles.viewPager} initialPage={0}>
        <View style={styles.page} key="1">
          <Text>First page</Text>
          <Text>Swipe ➡️</Text>
        </View>
        <View style={styles.page} key="2">
          <Text>Second page</Text>
        </View>
        <View style={styles.page} key="3">
          <Text>Third page</Text>
        </View>
      </ViewPager>
    </View>
  );
};

const styles = StyleSheet.create({
  viewPager: {
    flex: 1,
  },
  page: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MyPager;
```
