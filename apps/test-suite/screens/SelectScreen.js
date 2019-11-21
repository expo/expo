import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Alert,
  Button,
  FlatList,
  PixelRatio,
  Platform,
  Linking,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-navigation';

import PlatformTouchable from '../components/PlatformTouchable';
import ModulesContext from '../ModulesContext';

function CheckListItem({ onPress, isSelected, title }) {
  return (
    <PlatformTouchable onPress={onPress}>
      <View style={styles.listItem}>
        <View style={{ minWidth: 26, minHeight: 26 }}>
          <MaterialIcons name={isSelected ? 'check-box' : 'check-box-outline-blank'} size={26} />
        </View>
        <Text style={styles.label}>{title}</Text>
      </View>
    </PlatformTouchable>
  );
}

SelectionList.navigationOptions = {
  title: 'Test Suite',
};

export default function SelectionList({ navigation }) {
  const { modules, setIsTestActive, onToggleAll } = React.useContext(ModulesContext);

  function checkLinking(incomingTests) {
    if (incomingTests) {
      const testNames = incomingTests.split(',').map(v => v.trim());
      const selected = modules.filter(m => testNames.includes(m.name));
      if (!selected.length) {
        console.log('[TEST_SUITE]', 'No selected modules', testNames);
      }

      // TODO: Bacon: update context
      const parsedModules = modules.filter(m => testNames.includes(m.name));

      navigation.navigate('RunTests');
    }
  }

  const _handleOpenURL = ({ url }) => {
    setTimeout(() => {
      if (url && url.includes('select/')) {
        checkLinking(url.split('/').pop());
      }
    }, 100);
  };
  React.useEffect(() => {
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
    // this.modules = getTestModules();
    // this.state = {
    //   selected: new Set(),
    // };

    Linking.addEventListener('url', _handleOpenURL);

    Linking.getInitialURL()
      .then(url => {
        _handleOpenURL({ url });
        // TODO: Use Expo Linking library once parseURL is implemented for web
        if (url && url.includes('/all')) {
          // Test all available modules
          onToggleAll(true);
          navigation.navigate('RunTests');
        }
      })
      .catch(err => console.error('Failed to load initial URL', err));

    return () => {
      Linking.removeEventListener('url', _handleOpenURL);
    };
  }, []);

  const selected = modules.filter(({ isActive }) => isActive);
  const allSelected = selected.length === modules.length;
  const buttonTitle = allSelected ? 'Deselect All' : 'Select All';
  return (
    <View style={styles.mainContainer}>
      <FlatList
        data={modules}
        keyExtractor={({ name }, index) => `${index}-${name}`}
        renderItem={({ item: { name, isActive } }) => (
          <CheckListItem
            onPress={() => setIsTestActive(name, !isActive)}
            isSelected={isActive}
            title={name}
          />
        )}
      />
      <SafeAreaView style={styles.buttonRow}>
        <View style={styles.buttonContainer}>
          <Button title={buttonTitle} onPress={() => onToggleAll()} />
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title="Run Tests"
            onPress={() => {
              if (selected.length) {
                navigation.navigate('RunTests');
              } else {
                Alert.alert('Cannot Run Tests', 'You must select at least one test to run.');
              }
            }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  listItem: {
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
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

SelectionList.navigationOptions = {
  title: 'Test Suite',
};
