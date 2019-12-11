import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Button, FlatList, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-navigation';

import PlatformTouchable from '../components/PlatformTouchable';
import ModulesContext from '../ModulesContext';
import useLinking from '../utils/useLinking';

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

function parseSelectedQueryString(modules, testNames, url = '') {
  // if (!url) return null;
  // const afterSelect = url
  //   .toLowerCase()
  //   .split('select/')
  //   .pop();
  // if (!afterSelect) return [];

  // const testNames = afterSelect.split('%2c').map(v => v.trim());
  const selected = testNames.includes('all')
    ? modules
    : modules.filter(m => testNames.includes(m.name));
  if (!selected.length) {
    console.log('[TEST_SUITE]', 'No selected modules', testNames);
  }

  return selected;
}

function attachErrorThing() {
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
}

export default function SelectionList({ navigation }) {
  const { modules, setNavigation, setIsTestActive, onToggleAll } = React.useContext(ModulesContext);

  React.useEffect(() => {
    setNavigation(navigation);
    attachErrorThing();
  }, []);

  const selected = modules.filter(({ isActive }) => isActive);
  const allSelected = selected.length === modules.length;
  const buttonTitle = allSelected ? 'Deselect All' : 'Select All';

  const link = useLinking();

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (link && link.includes('select/')) {
        const endLink = link.split('/').pop();
        if (!endLink) return;
        const testNames = endLink.split(',').map(v => v.trim());

        const nextModules = parseSelectedQueryString(modules, testNames, link);
        if (!Array.isArray(nextModules)) return;

        const moduleNames = nextModules.map(({ name }) => name);
        console.log('test ==>>', moduleNames);

        for (const module of modules) {
          setIsTestActive(module.name, moduleNames.includes(module.name));
        }

        if (nextModules.length)
          navigation.navigate('TestScreen', {
            tests: encodeURI(nextModules.map(({ name }) => name).join(',')),
          });
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [link]);

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
                navigation.navigate('TestScreen', {
                  tests: encodeURI(selected.map(({ name }) => name).join(',')),
                  // tests: encodeURI(selected.map(({ name }) => name).join(',')).toLowerCase(),
                });
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
