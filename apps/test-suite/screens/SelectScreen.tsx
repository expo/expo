import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StackScreenProps } from '@react-navigation/stack';
import Constants from 'expo-constants';
import React from 'react';
import {
  Alert,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';

import { RootStackParamList } from '../AppNavigator';
import { getTestModules } from '../TestModules';
import PlatformTouchable from '../components/PlatformTouchable';
import Colors from '../constants/Colors';

type ListItemProps = {
  title: string;
  onPressItem: (id: string) => void;
  selected: boolean;
  id: string;
};

function ListItem({ title, onPressItem, selected, id }: ListItemProps) {
  function onPress() {
    onPressItem(id);
  }

  return (
    <PlatformTouchable onPress={onPress}>
      <View style={styles.listItem}>
        <Text style={styles.label}>{title}</Text>
        <MaterialCommunityIcons
          color={selected ? Colors.tintColor : 'black'}
          name={selected ? 'checkbox-marked' : 'checkbox-blank-outline'}
          size={24}
        />
      </View>
    </PlatformTouchable>
  );
}

function createQueryString(tests: string[]) {
  if (!Array.isArray(tests) || !tests.every((v) => typeof v === 'string')) {
    throw new Error(
      `test-suite: Cannot create query string for runner. Expected array of strings, instead got: ${tests}`
    );
  }
  const uniqueTests = [...new Set(tests)];
  // Skip encoding or React Navigation will encode twice
  return uniqueTests.join(' ');
}

type Props = StackScreenProps<RootStackParamList, 'select'>;

type State = {
  selected: Set<string>;
  // modules are require('module-with-tests')
  modules: any[];
};

export default class SelectScreen extends React.PureComponent<Props, State> {
  state = {
    selected: new Set<string>(),
    modules: [],
  };

  constructor(props) {
    super(props);

    if (global.ErrorUtils) {
      const originalErrorHandler = global.ErrorUtils.getGlobalHandler();

      global.ErrorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
        // Prevent optionalRequire from failing
        if (
          isFatal &&
          (error.message.includes('Native module cannot be null') ||
            error.message.includes(
              `from NativeViewManagerAdapter isn't exported by @unimodules/react-native-adapter. Views of this type may not render correctly. Exported view managers: `
            ))
        ) {
          console.log('Caught require error');
        } else {
          originalErrorHandler(error, isFatal);
        }
      });
    }
  }

  componentWillUnmount() {
    Linking.removeEventListener('url', this._handleOpenURL);
  }

  checkLinking = (incomingTests: string) => {
    // TODO(Bacon): bare-expo should pass a space-separated string.
    const tests = incomingTests.split(',').map((v) => v.trim());
    const query = createQueryString(tests);
    this.props.navigation.navigate('run', { tests: query });
  };

  _handleOpenURL = ({ url }) => {
    url = url || '';
    // TODO: Use Expo Linking library once parseURL is implemented for web
    if (url.includes('/select/')) {
      const selectedTests = url.split('/').pop();
      if (selectedTests) {
        this.checkLinking(selectedTests);
        return;
      }
    }

    if (url.includes('/all')) {
      // Test all available modules
      const query = createQueryString(getTestModules().map((m) => m.name));

      this.props.navigation.navigate('run', {
        tests: query,
      });
      return;
    }

    // Application wasn't started from a deep link which we handle. So, we can load test modules.
    this._loadTestModules();
  };

  _loadTestModules = () => {
    this.setState({
      modules: getTestModules(),
    });
  };

  componentDidMount() {
    Linking.addEventListener('url', this._handleOpenURL);

    Linking.getInitialURL()
      .then((url) => {
        this._handleOpenURL({ url });
      })
      .catch((err) => console.error('Failed to load initial URL', err));
  }

  _keyExtractor = ({ name }) => name;

  _onPressItem = (id: string) => {
    this.setState((state) => {
      const selected = new Set(state.selected);
      if (selected.has(id)) selected.delete(id);
      else selected.add(id);
      return { selected };
    });
  };

  _renderItem = ({ item: { name } }) => (
    <ListItem
      id={name}
      onPressItem={this._onPressItem}
      selected={this.state.selected.has(name)}
      title={name}
    />
  );

  _selectAll = () => {
    this.setState((state) => {
      if (state.selected.size === state.modules.length) {
        return { selected: new Set() };
      }
      return { selected: new Set(state.modules.map((item) => item.name)) };
    });
  };

  _navigateToTests = () => {
    const { selected } = this.state;
    if (selected.size === 0) {
      Alert.alert('Cannot Run Tests', 'You must select at least one test to run.');
    } else {
      const query = createQueryString([...selected]);

      this.props.navigation.navigate('run', { tests: query });
    }
  };

  render() {
    const { selected } = this.state;
    const allSelected = selected.size === this.state.modules.length;
    const buttonTitle = allSelected ? 'Deselect All' : 'Select All';

    return (
      <React.Fragment>
        <FlatList
          data={this.state.modules}
          extraData={this.state}
          keyExtractor={this._keyExtractor}
          renderItem={this._renderItem}
          initialNumToRender={15}
        />
        <Footer
          buttonTitle={buttonTitle}
          canRunTests={selected.size}
          onRun={this._navigateToTests}
          onToggle={this._selectAll}
        />
      </React.Fragment>
    );
  }
}

type FooterProps = {
  buttonTitle: string;
  canRunTests: boolean;
  onToggle: () => void;
  onRun: () => void;
};

function Footer({ buttonTitle, canRunTests, onToggle, onRun }: FooterProps) {
  const { bottom, left, right } = useSafeArea();

  const isRunningInDetox = Constants.manifest && Constants.manifest.slug === 'bare-expo';
  const paddingVertical = 16;

  return (
    <View
      style={[
        styles.buttonRow,
        { paddingBottom: isRunningInDetox ? 0 : bottom, paddingLeft: left, paddingRight: right },
      ]}>
      <FooterButton
        style={{ paddingVertical, alignItems: 'flex-start' }}
        title={buttonTitle}
        onPress={onToggle}
      />
      <FooterButton
        style={{ paddingVertical, alignItems: 'flex-end' }}
        title="Run Tests"
        disabled={!canRunTests}
        onPress={onRun}
      />
    </View>
  );
}

type FooterButtonProps = TouchableOpacityProps & {
  title: string;
};

function FooterButton({ title, style, ...props }: FooterButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.footerButton, { opacity: props.disabled ? 0.4 : 1 }, style]}
      {...props}>
      <Text style={styles.footerButtonTitle}>{title}</Text>
    </TouchableOpacity>
  );
}

const HORIZONTAL_MARGIN = 24;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  footerButtonTitle: {
    fontSize: 18,
    color: Colors.tintColor,
  },
  footerButton: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: HORIZONTAL_MARGIN,
  },
  listItem: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: HORIZONTAL_MARGIN,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#dddddd',
  },
  label: {
    color: 'black',
    fontSize: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#dddddd',
    backgroundColor: 'white',
  },
  contentContainerStyle: {
    paddingBottom: 128,
  },
});
