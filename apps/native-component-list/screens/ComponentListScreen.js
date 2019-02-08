import React from 'react';
import { FlatList, PixelRatio, StyleSheet, Text, TouchableHighlight, View } from 'react-native';

import { Entypo } from '@expo/vector-icons';
import { withNavigation } from 'react-navigation';
import ExpoAPIIcon from '../components/ExpoAPIIcon';

class ComponentListScreen extends React.Component {
  _renderExampleSection = ({ item: { name: exampleName, isAvailable } }) => {
    return (
      <TouchableHighlight
        underlayColor="#dddddd"
        style={styles.rowTouchable}
        onPress={isAvailable ? () => this.props.navigation.navigate(exampleName) : undefined}>
        <View style={[styles.row, !isAvailable && styles.disabledRow]}>
          <ExpoAPIIcon name={exampleName} style={styles.rowIcon} />
          <Text style={styles.rowLabel}>{exampleName}</Text>
          <Text style={styles.rowDecorator}>
            <Entypo name="chevron-right" size={16} color="#aaaaaa" />
          </Text>
        </View>
      </TouchableHighlight>
    );
  };

  _keyExtractor = item => item.name;

  render() {
    return (
      <FlatList
        ref={view => {
          this._listView = view;
        }}
        stickySectionHeadersEnabled
        removeClippedSubviews={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ backgroundColor: '#fff' }}
        data={this.props.apis}
        keyExtractor={this._keyExtractor}
        renderItem={this._renderExampleSection}
      />
    );
  }

  _scrollToTop = () => {
    this._listView.scrollTo({ x: 0, y: 0 });
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
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
  disabledRow: {
    opacity: 0.3,
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

export default withNavigation(ComponentListScreen);
