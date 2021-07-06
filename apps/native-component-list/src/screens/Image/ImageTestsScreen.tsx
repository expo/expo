import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import ListButton from '../../components/ListButton';
import Colors from '../../constants/Colors';
import imageTests from './tests';
import { ImageTest, ImageTestGroup } from './types';

type Link = {
  ImageTests: { tests: ImageTestGroup };
  ImageTest: { test: ImageTest | ImageTestGroup; tests: (ImageTest | ImageTestGroup)[] };
};

type Props = StackScreenProps<Link, 'ImageTests'>;

export default function ImageTestsScreen({ navigation, route }: Props) {
  React.useLayoutEffect(() => {
    const tests: ImageTestGroup = route.params.tests ?? imageTests;
    navigation.setOptions({
      title: tests.name,
    });
  }, [navigation, route.params.tests]);

  const onPressItem = (test: ImageTest | ImageTestGroup) => {
    const tests: ImageTestGroup = route.params.tests ?? imageTests;
    // @ts-ignore
    if (test.tests) {
      navigation.push('ImageTests', {
        // @ts-ignore
        tests: test,
      });
    } else {
      navigation.push('ImageTest', {
        test,
        tests: tests.tests,
      });
    }
  };

  const tests: ImageTestGroup = route.params.tests ?? imageTests;
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {tests.tests.map((test, index) => (
          <ListButton key={`item${index}`} title={test.name} onPress={() => onPressItem(test)} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.greyBackground,
    paddingHorizontal: 10,
    paddingVertical: 16,
  },
  content: {
    flex: 1,
  },
});
