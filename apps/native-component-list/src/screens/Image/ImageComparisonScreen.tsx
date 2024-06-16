import * as React from 'react';
import { Animated, SectionList, StyleSheet, Text, View } from 'react-native';

import { ImageTestListItem } from './ImageTestListItem';
import imageTests from './tests';
import { ImageTest } from './types';
import Colors from '../../constants/Colors';

export function ImageComparisonBody({
  useAnimatedComponent,
  animValue,
  sections,
}: {
  useAnimatedComponent?: boolean;
  animValue?: Animated.Value;
  sections: { title: string; data: ImageTest[] }[];
}) {
  const renderItem = ({ item }: { item: ImageTest }) => {
    return (
      <ImageTestListItem
        test={item}
        animValue={animValue}
        useAnimatedComponent={!!useAnimatedComponent}
      />
    );
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

export default function ImageComparisonScreen() {
  const sections = imageTests.tests.map((test) => ({
    title: test.name,
    data: test.tests,
  }));
  return <ImageComparisonBody sections={sections} />;
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
