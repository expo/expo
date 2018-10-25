import React from 'react';
import { StyleSheet, View, FlatList, Text, TouchableHighlight, PixelRatio } from 'react-native';
import { Entypo } from '@expo/vector-icons';

import * as examples from './examples';

export default class SVGScreen extends React.Component {
  static navigationOptions = {
    title: '<Svg />',
  };

  renderItem = ({ item: exampleKey }) => (
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
          <Entypo name="chevron-right" size={16} color="#aaaaaa" />
        </Text>
      </View>
    </TouchableHighlight>
  );

  keyExtractor = item => item;

  render() {
    return (
      <FlatList
        style={styles.container}
        data={Object.keys(examples)}
        renderItem={this.renderItem}
        keyExtractor={this.keyExtractor}
        contentContainerStyle={styles.contentContainer}
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
