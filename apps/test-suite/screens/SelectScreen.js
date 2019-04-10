import React from 'react';
import {
  TouchableHighlight,
  TouchableNativeFeedback,
  StyleSheet,
  FlatList,
  View,
  Text,
  Platform,
  Linking,
  Alert,
  Button,
  PixelRatio,
} from 'react-native';
import { SafeAreaView } from 'react-navigation';
import { MaterialIcons } from '@expo/vector-icons';
import { getTestModules } from '../TestUtils';

class ListItem extends React.Component {
  onPress = () => {
    this.props.onPressItem(this.props.id);
  };

  renderView = () => {
    const checkBox = this.props.selected ? 'check-box' : 'check-box-outline-blank';
    return (
      <View style={styles.listItem}>
        <MaterialIcons name={checkBox} size={26} />
        <Text style={styles.label}>{this.props.title}</Text>
      </View>
    );
  };

  render() {
    return Platform.select({
      android: (
        <TouchableNativeFeedback onPress={this.onPress}>
          {this.renderView()}
        </TouchableNativeFeedback>
      ),
      default: (
        <TouchableHighlight onPress={this.onPress} underlayColor="lightgray">
          {this.renderView()}
        </TouchableHighlight>
      ),
    });
  }
}

export default class SelectScreen extends React.PureComponent {
  constructor(props) {
    super(props);

    this.modules = getTestModules();
    this.state = {
      selected: new Set(),
    };
  }

  componentDidMount() {
    Linking.getInitialURL()
      .then(url => {
        // TODO: Use Expo Linking library once parseURL is implemented for web
        if (url && url.indexOf('/all') > -1) {
          // Test all available modules
          this.props.navigation.navigate('RunTests', {
            selected: this.modules,
          });
        }
      })
      .catch(err => console.error('Failed to load initial URL', err));
  }

  static navigationOptions = {
    title: 'Test Suite',
  };

  _keyExtractor = item => item.name;

  _onPressItem = id => {
    this.setState(state => {
      const selected = new Set(state.selected);
      if (selected.has(id)) selected.delete(id);
      else selected.add(id);
      return { selected };
    });
  };

  _renderItem = ({ item }) => (
    <ListItem
      id={item.name}
      onPressItem={this._onPressItem}
      selected={this.state.selected.has(item.name)}
      title={item.name}
    />
  );

  _selectAll = () => {
    this.setState(state => {
      if (state.selected.size === this.modules.length) {
        return { selected: new Set() };
      }
      return { selected: new Set(this.modules.map(this._keyExtractor)) };
    });
  };

  _getSelected = () => {
    const selected = this.state.selected;
    const selectedModules = this.modules.filter(m => selected.has(m.name));
    return selectedModules;
  };

  _navigateToTests = () => {
    const selected = this._getSelected();
    if (selected.length === 0) {
      Alert.alert('Cannot Run Tests', 'You must select at least one test to run.');
    } else {
      this.props.navigation.navigate('RunTests', { selected });
      this.setState({ selected: new Set() });
    }
  };

  render() {
    const allSelected = this.state.selected.size === this.modules.length;
    const buttonTitle = allSelected ? 'Deselect All' : 'Select All';
    return (
      <View style={styles.mainContainer}>
        <FlatList
          data={this.modules}
          extraData={this.state}
          keyExtractor={this._keyExtractor}
          renderItem={this._renderItem}
        />
        <SafeAreaView style={styles.buttonRow}>
          <View style={styles.buttonContainer}>
            <Button title={buttonTitle} onPress={this._selectAll} />
          </View>
          <View style={styles.buttonContainer}>
            <Button title="Run Tests" onPress={this._navigateToTests} />
          </View>
        </SafeAreaView>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    color: 'black',
    fontSize: 18,
    marginLeft: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 12,
    paddingTop: 12,
    backgroundColor: '#ECEFF1',
  },
  buttonContainer: {
    flex: 1,
    marginLeft: Platform.OS === 'android' ? 10 : 0,
    marginRight: Platform.OS === 'android' ? 10 : 0,
  },
});
