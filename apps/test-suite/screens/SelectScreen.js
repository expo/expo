import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import {
  Alert,
  FlatList,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';

import * as Analytics from 'expo-firebase-analytics';
import PlatformTouchable from '../components/PlatformTouchable';
import Colors from '../constants/Colors';
import { getTestModules } from '../TestUtils';

Analytics.initAppAsync(
  Platform.select({
    android: require('bare-expo/google-services.json'),
    ios: {
      CLIENT_ID: '1026763265415-4t723ioaqvjgbipp72ojp81hu529on4j.apps.googleusercontent.com',
      REVERSED_CLIENT_ID:
        'com.googleusercontent.apps.1026763265415-4t723ioaqvjgbipp72ojp81hu529on4j',
      API_KEY: 'AIzaSyBgH9mo9R8WGN4tcuf7M3HZHVj44zSDvs4',
      GCM_SENDER_ID: '1026763265415',
      PLIST_VERSION: '1',
      BUNDLE_ID: 'dev.expo.Payments',
      PROJECT_ID: 'test-suite-ecd20',
      STORAGE_BUCKET: 'test-suite-ecd20.appspot.com',
      IS_ADS_ENABLED: false,
      IS_ANALYTICS_ENABLED: true,
      IS_APPINVITE_ENABLED: true,
      IS_GCM_ENABLED: true,
      IS_SIGNIN_ENABLED: true,
      GOOGLE_APP_ID: '1:1026763265415:ios:d138a28b64768c9ee8af22',
      DATABASE_URL: 'https://test-suite-ecd20.firebaseio.com',
    },
  })
).then(async () => {
  await Analytics.setAnalyticsCollectionEnabledAsync(true);
});

const prefix = Platform.select({ default: 'md', ios: 'ios' });

function ListItem({ title, onPressItem, selected, id }) {
  function onPress() {
    Analytics.logEventAsync('toggle_test_suite_test', { test_id: id });
    onPressItem(id);
  }

  const checkBox = selected ? 'checkbox' : 'checkbox-outline';

  return (
    <PlatformTouchable onPress={onPress}>
      <View style={styles.listItem}>
        <Text style={styles.label}>{title}</Text>
        <Ionicons
          color={selected ? Colors.tintColor : 'black'}
          name={`${prefix}-${checkBox}`}
          size={24}
        />
      </View>
    </PlatformTouchable>
  );
}

export default class SelectScreen extends React.PureComponent {
  state = {
    selected: new Set(),
  };

  constructor(props) {
    super(props);

    Analytics.setCurrentScreenAsync('SelectScreen');
    if (global.ErrorUtils) {
      const originalErrorHandler = global.ErrorUtils.getGlobalHandler();

      global.ErrorUtils.setGlobalHandler((error, isFatal) => {
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
    this.modules = getTestModules();
  }

  componentWillUnmount() {
    Linking.removeEventListener('url', this._handleOpenURL);
  }

  checkLinking = incomingTests => {
    if (incomingTests) {
      const testNames = incomingTests.split(',').map(v => v.trim());
      const selected = this.modules.filter(m => testNames.includes(m.name));
      if (!selected.length) {
        console.log('[TEST_SUITE]', 'No selected modules', testNames);
      }
      this.props.navigation.navigate('RunTests', { selected });
    }
  };

  _handleOpenURL = ({ url }) => {
    setTimeout(() => {
      if (url && url.includes('select/')) {
        this.checkLinking(url.split('/').pop());
      }
    }, 100);
  };

  componentDidMount() {
    Linking.addEventListener('url', this._handleOpenURL);

    Linking.getInitialURL()
      .then(url => {
        this._handleOpenURL({ url });
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
    title: 'Expo Test Suite',
  };

  _keyExtractor = ({ name }) => name;

  _onPressItem = id => {
    this.setState(state => {
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
    this.setState(state => {
      if (state.selected.size === this.modules.length) {
        return { selected: new Set() };
      }
      return { selected: new Set(this.modules.map(item => item.name)) };
    });
  };

  _getSelected = () => {
    const { selected } = this.state;
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
    const { selected } = this.state;
    const allSelected = selected.size === this.modules.length;
    const buttonTitle = allSelected ? 'Deselect All' : 'Select All';
    return (
      <React.Fragment>
        <FlatList
          data={this.modules}
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

function Footer({ buttonTitle, canRunTests, onToggle, onRun }) {
  const { bottom, left, right } = useSafeArea();

  const paddingVertical = (bottom || 12) + 8;

  return (
    <View style={[styles.buttonRow, { paddingLeft: left, paddingRight: right }]}>
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

function FooterButton({ title, style, ...props }) {
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
