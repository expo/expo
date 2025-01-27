import { H4 } from '@expo/html-elements';
import { BottomSheet, BottomSheetProps } from '@expo/ui/components/BottomSheet';
import * as React from 'react';
import { Platform, FlatList, ScrollView, View, StyleSheet } from 'react-native';

import { Page } from '../../components/Page';

export default function UIScreen() {
  return (
    <Page>
      <View style={{ height: 0 }}></View>
      <BottomSheet>
        <View style={{ flex: 1, backgroundColor: 'red', width: 100, height: 120, margin: 10 }} />
      </BottomSheet>
    </Page>
  );
}

const styles = StyleSheet.create({
  buttonStyle: {
    width: 150,
    height: 50,
    margin: 5,
    overflow: 'visible',
  },
  stretch: {
    alignSelf: 'stretch',
  },
  columnWrapper: {
    justifyContent: 'space-around',
    alignContent: 'space-around',
  },
});
