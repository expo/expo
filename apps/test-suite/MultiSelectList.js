import React from 'react';
import {
  TouchableHighlight,
  TouchableNativeFeedback,
  StyleSheet,
  FlatList,
  View,
  Text,
  Platform,
  PixelRatio,
} from 'react-native';

class ListItem extends React.Component {
  onPress = () => {
    this.props.onPressItem(this.props.id);
  };

  renderLabel() {
    const textColor = this.props.selected ? 'red' : 'black';
    return <Text style={{ color: textColor }}>{this.props.title}</Text>;
  }

  render() {
    if (Platform.OS === 'android') {
      return (
        <TouchableNativeFeedback
          onPress={this.onPress}
          background={TouchableNativeFeedback.Ripple('#FFF')}>
          <View style={styles.listItem}>{this.renderLabel()}</View>
        </TouchableNativeFeedback>
      );
    } else {
      return (
        <TouchableHighlight style={styles.listItem} underlayColor="#0052AC" onPress={this.onPress}>
          {this.renderLabel()}
        </TouchableHighlight>
      );
    }
  }
}

export default class MultiSelectList extends React.PureComponent {
  state = { selected: new Map() };

  _keyExtractor = item => item.name;

  _onPressItem = id => {
    this.setState(state => {
      const selected = new Map(state.selected);
      selected.set(id, !selected.get(id)); // toggle
      return { selected };
    });
  };

  _renderItem = ({ item }) => (
    <ListItem
      id={item.name}
      onPressItem={this._onPressItem}
      selected={!!this.state.selected.get(item.name)}
      title={item.name}
    />
  );

  render() {
    return (
      <FlatList
        data={this.props.data}
        extraData={this.state}
        keyExtractor={this._keyExtractor}
        renderItem={this._renderItem}
        style={this.props.style}
      />
    );
  }
}

const styles = StyleSheet.create({
  label: {
    color: 'black',
  },
  listItem: {
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderBottomWidth: 1.0 / PixelRatio.get(),
    borderBottomColor: '#dddddd',
  },
});
