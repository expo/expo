import { MaterialIcons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, SectionList, View, Text } from 'react-native';
import { NavigationScreenProps, NavigationScreenConfig } from 'react-navigation';
import HeaderButtons from 'react-navigation-header-buttons';

import Colors from '../../constants/Colors';
import ImageTestListItem from './ImageTestListItem';
import imageTests from './tests';
import { ImageTest } from './types';

// @ts-ignore
const flattenedTests = imageTests.tests.map(test => (test.tests ? test.tests : [test])).flat();

export default class ImageAllTestsScreen extends React.Component<NavigationScreenProps> {
  static navigationOptions: NavigationScreenConfig<object> = ({ navigation }) => {
    return {
      title: imageTests.name,
      headerRight: (
        <HeaderButtons IconComponent={MaterialIcons} iconSize={25}>
          <HeaderButtons.Item
            title="list"
            iconName="list"
            onPress={() =>
              navigation.push('ImageTests', {
                // @ts-ignore
                tests: imageTests,
              })
            }
          />
        </HeaderButtons>
      ),
    };
  };

  renderItem = ({ item }: any) => {
    const test: ImageTest = item;
    return (
      <ImageTestListItem navigation={this.props.navigation} test={test} tests={flattenedTests} />
    );
  };

  renderSectionHeader = ({ section }: any) => {
    return (
      <View style={styles.header}>
        <Text style={styles.title}>{section.title}</Text>
      </View>
    );
  };

  keyExtractor = (item: any, index: number) => {
    return item + index;
  };

  render() {
    const sections = imageTests.tests.map(test => ({
      title: test.name,
      // @ts-ignore
      data: test.tests,
    }));

    return (
      <View style={styles.container}>
        <SectionList
          style={styles.content}
          sections={sections}
          renderItem={this.renderItem}
          renderSectionHeader={this.renderSectionHeader}
          keyExtractor={this.keyExtractor}
        />
      </View>
    );
  }
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
