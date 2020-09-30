import { EvilIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Text,
  TouchableHighlight,
  PixelRatio,
  ListRenderItem,
} from 'react-native';

import examples from './examples';

type StackParams = {
  SVGExample: { title: string; key: string };
};

export default class SVGScreen extends React.Component<{
  navigation: StackNavigationProp<StackParams>;
}> {
  static navigationOptions = {
    title: '<Svg />',
  };

  renderItem: ListRenderItem<string> = ({ item: exampleKey }) => (
    <TouchableHighlight
      underlayColor="#dddddd"
      style={styles.rowTouchable}
      onPress={() =>
        this.props.navigation.navigate('SVGExample', { title: exampleKey, key: exampleKey })
      }>
      <View style={styles.row}>
        <View style={styles.rowIcon}>{examples[exampleKey].icon}</View>
        <Text style={styles.rowLabel}>{exampleKey}</Text>
        <Text style={styles.rowDecorator}>
          <EvilIcons name="chevron-right" size={24} color="#595959" />
        </Text>
      </View>
    </TouchableHighlight>
  );

  keyExtractor = (item: string) => item;

  render() {
    return (
      <FlatList<string>
        style={styles.container}
        data={Object.keys(examples)}
        renderItem={this.renderItem}
        keyExtractor={this.keyExtractor}
      />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowDecorator: {
    alignSelf: 'flex-end',
    paddingRight: 4,
  },
  rowTouchable: {
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderBottomWidth: 1.0 / PixelRatio.get(),
    borderBottomColor: '#dddddd',
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
  },
  rowIcon: {
    marginRight: 10,
    marginLeft: 6,
  },
});
