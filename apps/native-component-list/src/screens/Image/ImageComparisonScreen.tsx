import * as React from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import Colors from '../../constants/Colors';
import ImageTestListItem from './ImageTestListItem';
import imageTests from './tests';
import { ImageTest } from './types';

export default function ImageComparisonScreen() {
  const renderItem = ({ item }: any) => {
    const test: ImageTest = item;
    return <ImageTestListItem test={test} />;
  };

  const renderSectionHeader = ({ section }: any) => {
    return (
      <View style={styles.header}>
        <Text style={styles.title}>{section.title}</Text>
      </View>
    );
  };

  const keyExtractor = (item: any, index: number) => {
    return item + index;
  };

  const sections = imageTests.tests.map((test) => ({
    title: test.name,
    // @ts-ignore
    data: test.tests,
  }));

  return (
    <View style={styles.container}>
      <SectionList
        style={styles.content}
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={keyExtractor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.greyBackground,
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 4,
    borderBottomColor: Colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
  },
});
