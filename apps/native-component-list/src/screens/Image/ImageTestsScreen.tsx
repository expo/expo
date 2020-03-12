import * as React from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { NavigationScreenProps, NavigationScreenConfig } from 'react-navigation';

import ListButton from '../../components/ListButton';
import Colors from '../../constants/Colors';
import imageTests from './tests';
import { ImageTest, ImageTestGroup } from './types';

export default class ImageTestsScreen extends React.Component<NavigationScreenProps> {
  static navigationOptions: NavigationScreenConfig<object> = ({ navigation }) => {
    const tests: ImageTestGroup = navigation.getParam('tests') || imageTests;
    return {
      title: tests.name,
    };
  };

  render() {
    const { navigation } = this.props;
    const tests: ImageTestGroup = navigation.getParam('tests') || imageTests;
    return (
      <View style={styles.container}>
        <ScrollView style={styles.content}>
          {tests.tests.map((test, index) => (
            <ListButton
              key={`item${index}`}
              title={test.name}
              onPress={() => this.onPressItem(test)}
            />
          ))}
        </ScrollView>
      </View>
    );
  }

  onPressItem = (test: ImageTest | ImageTestGroup) => {
    const { navigation } = this.props;
    const tests: ImageTestGroup = navigation.getParam('tests') || imageTests;
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
