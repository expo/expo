import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import HeaderContainerRight from '../../components/HeaderContainerRight';
import HeaderIconButton from '../../components/HeaderIconButton';
import Colors from '../../constants/Colors';
import { addSelectedComponentChangeListener } from './ImageComponents';
import ImageTestListItem from './ImageTestListItem';
import imageTests from './tests';
import { ImageTest, Links } from './types';

// @ts-ignore
const flattenedTests = imageTests.tests.map((test) => (test.tests ? test.tests : [test])).flat();

type Props = StackScreenProps<Links, 'ImageTest'>;

export default function ImageAllTestsScreen({ navigation }: Props) {
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: imageTests.name,
      headerRight: () => (
        <HeaderContainerRight>
          <HeaderIconButton
            name="md-list"
            onPress={() =>
              navigation.push('ImageTests', {
                // @ts-ignore
                tests: imageTests,
              })
            }
          />
        </HeaderContainerRight>
      ),
    });
  }, [navigation]);

  let listener: any;

  const [reloadCount, setReloadCount] = React.useState<number>(0);

  React.useEffect(() => {
    listener = addSelectedComponentChangeListener(() => setReloadCount(reloadCount + 1));
    return () => {
      listener();
    };
  }, []);

  const renderItem = ({ item }: any) => {
    const test: ImageTest = item;
    return <ImageTestListItem navigation={navigation} test={test} tests={flattenedTests} />;
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
    <View key={`key${reloadCount}`} style={styles.container}>
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
