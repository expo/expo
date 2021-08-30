import React from 'react';
import { StyleSheet, View } from 'react-native';

import { DevMenuItemAnyType } from '../../DevMenuInternal';
import ListFooter from '../ListFooter';
import DevMenuGroup from './DevMenuGroup';

type Props = {
  items: DevMenuItemAnyType[];
};

export default class DevMenuScreen extends React.PureComponent<Props> {
  static navigationOptions = {
    headerShown: true,
  };

  render() {
    return (
      <View style={styles.container}>
        <DevMenuGroup items={this.props.items} />
        <ListFooter label="This development menu will not be present in any release builds of this project." />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 50,
  },
});
