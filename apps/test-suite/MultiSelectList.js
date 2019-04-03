import React from 'react';
import {
  TouchableHighlight,
  TouchableNativeFeedback,
  StyleSheet,
  FlatList,
  View,
  Text,
  Platform,
  Button,
  StatusBar,
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
      <View style={styles.mainContainer}>
        <FlatList
          data={this.props.data}
          extraData={this.state}
          keyExtractor={this._keyExtractor}
          renderItem={this._renderItem}
          style={styles.flatList}
        />
        <View style={styles.buttonRow}>
          <View style={styles.buttonContainer}>
            <Button title="Select All" onPress={() => console.log('Pressed')} />
          </View>
          <View style={styles.buttonContainer}>
            <Button title="Run Tests" onPress={() => console.log('Pressed')} />
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  flatList: {
    marginTop: StatusBar.currentHeight,
  },
  listItem: {
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderBottomWidth: 1.0 / PixelRatio.get(),
    borderBottomColor: '#dddddd',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  buttonContainer: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
});
