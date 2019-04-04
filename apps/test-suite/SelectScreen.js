import React from 'react';
import {
  TouchableHighlight,
  TouchableNativeFeedback,
  StyleSheet,
  FlatList,
  View,
  Text,
  Platform,
  Alert,
  Button,
  PixelRatio,
} from 'react-native';
import getTestModules from './Modules';

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

export default class SelectScreen extends React.PureComponent {
  constructor(props) {
    super(props);
    this.allModules = getTestModules();
    this.tests = this.allModules.map(module => {
      return { name: module.name };
    });
    const initialValues = this.tests.map(item => [item.name, false]);

    this.state = {
      selected: new Map(initialValues),
      allSelected: false,
    };
    this._selectAll = this._selectAll.bind(this);
    this._getSelected = this._getSelected.bind(this);
  }

  static navigationOptions = {
    title: 'Test Suite',
  };

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
      selected={this.state.selected.get(item.name)}
      title={item.name}
    />
  );

  _selectAll = () => {
    this.setState(state => {
      const selected = new Map(state.selected);
      for (const key of selected.keys()) {
        selected.set(key, !state.allSelected);
      }
      return { selected, allSelected: !state.allSelected };
    });
  };

  _getSelected = () => {
    const selected = this.state.selected;
    const set = new Set();
    for (const test of selected.keys()) {
      if (selected.get(test)) {
        set.add(test);
      }
    }
    const selectedModules = this.allModules.filter(m => set.has(m.name));
    return selectedModules;
  };

  _navigateToTests = () => {
    const selected = this._getSelected();
    if (selected.size === 0) {
      Alert.alert('Cannot Run Tests', 'You must select at least one test to run.');
    } else {
      this.props.navigation.navigate('RunTests', {
        selected,
      });
    }
  };

  render() {
    const buttonTitle = this.state.allSelected ? 'Deselect All' : 'Select All';
    return (
      <View style={styles.mainContainer}>
        <FlatList
          data={this.tests}
          extraData={this.state}
          keyExtractor={this._keyExtractor}
          renderItem={this._renderItem}
        />
        <View style={styles.buttonRow}>
          <View style={styles.buttonContainer}>
            <Button title={buttonTitle} onPress={this._selectAll} />
          </View>
          <View style={styles.buttonContainer}>
            <Button title="Run Tests" onPress={() => this._navigateToTests()} />
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
    paddingBottom: 10,
    paddingTop: 10,
    backgroundColor: 'grey',
  },
  buttonContainer: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
});
