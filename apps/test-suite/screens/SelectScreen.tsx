import { Checkbox } from 'expo-checkbox';
import Constants from 'expo-constants';
import * as React from 'react';
import { Alert, FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../common/ThemeProvider';
import { getTestModules, Module } from '../TestModules';
import {
  createQueryString,
  getScreenIdForLinking,
  getSelectedTestNames,
} from './getScreenIdForLinking';
import PlatformTouchable from '../components/PlatformTouchable';
import { routeNames } from '../constants/routeNames';

function ListItem({
  title,
  onPressItem,
  selectedSet,
  id,
}: {
  title: string;
  onPressItem: (id: string) => void;
  selectedSet: Set<string>;
  id: string;
}) {
  const { theme } = useTheme();
  const onPress = () => onPressItem(id);

  return (
    <PlatformTouchable onPress={onPress}>
      <View style={[styles.listItem, { borderBottomColor: theme.border.secondary }]}>
        <Text style={[styles.label, { color: theme.text.default }]}>{title}</Text>
        <View style={{ pointerEvents: 'none' }}>
          <Checkbox color={theme.icon.info} value={selectedSet.has(id)} />
        </View>
      </View>
    </PlatformTouchable>
  );
}

export default function SelectScreen({ navigation }) {
  const { theme } = useTheme();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const selectedRef = React.useRef(selected);
  selectedRef.current = selected;
  const [modules, setModules] = React.useState<Module[]>([]);

  React.useEffect(() => {
    if (global.ErrorUtils) {
      const originalErrorHandler = global.ErrorUtils.getGlobalHandler();

      global.ErrorUtils.setGlobalHandler((error, isFatal) => {
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
  }, []);

  const handleOpenURL = React.useCallback(
    ({ url }: { url: string }) => {
      url = url || '';
      // TODO: Use Expo Linking library once parseURL is implemented for web
      if (url.includes(`/${routeNames.select}/`)) {
        const selectedTests = url.split('/').pop();
        if (selectedTests) {
          const tests = getSelectedTestNames(selectedTests);
          const query = createQueryString(tests);
          navigation.navigate(routeNames.run, { tests: query });
          return;
        }
      }

      if (url.includes('/all')) {
        const query = createQueryString(getTestModules().map((m) => m.name));
        navigation.navigate(routeNames.run, { tests: query });
        return;
      }

      // Application wasn't started from a deep link which we handle. So, we can load test modules.
      setModules(getTestModules());
    },
    [navigation]
  );

  React.useEffect(() => {
    const subscription = Linking.addEventListener('url', handleOpenURL);

    Linking.getInitialURL()
      .then((url) => {
        handleOpenURL({ url });
      })
      .catch((err) => console.error('Failed to load initial URL', err));

    return () => {
      subscription?.remove();
    };
  }, [handleOpenURL]);

  const keyExtractor = React.useCallback(({ name }) => name, []);

  const onPressItem = React.useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const renderItem = React.useCallback(
    ({ item }: { item: Module }) => {
      const { name } = item;
      const id = getScreenIdForLinking(item);
      return (
        <ListItem
          id={id}
          onPressItem={onPressItem}
          selectedSet={selectedRef.current}
          title={name}
        />
      );
    },
    [onPressItem]
  );

  const selectAll = React.useCallback(() => {
    setSelected((prev) => {
      if (prev.size === modules.length) {
        return new Set<string>();
      }
      return new Set<string>(modules.map(getScreenIdForLinking));
    });
  }, [modules]);

  const navigateToTests = React.useCallback(() => {
    if (selected.size === 0) {
      Alert.alert('Cannot Run Tests', 'You must select at least one test to run.');
    } else {
      const query = createQueryString(Array.from(selected.values()));
      navigation.navigate(routeNames.run, { tests: query });
    }
  }, [selected, navigation]);

  const allSelected = selected.size === modules.length;
  const buttonTitle = allSelected ? 'Deselect All' : 'Select All';

  return (
    <>
      <FlatList<Module>
        data={modules}
        extraData={selected}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        initialNumToRender={15}
        style={{ backgroundColor: theme.background.screen }}
      />
      <Footer
        buttonTitle={buttonTitle}
        canRunTests={selected.size}
        onRun={navigateToTests}
        onToggle={selectAll}
      />
    </>
  );
}

function Footer({ buttonTitle, canRunTests, onToggle, onRun }) {
  const { bottom, left, right } = useSafeAreaInsets();
  const { theme } = useTheme();

  const isRunningInBareExpo = Constants.expoConfig.slug === 'bare-expo';
  const paddingVertical = 16;

  return (
    <View
      style={[
        styles.buttonRow,
        {
          paddingBottom: isRunningInBareExpo ? 0 : bottom,
          paddingLeft: left,
          paddingRight: right,
          borderColor: theme.border.default,
          backgroundColor: theme.background.default,
        },
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

function FooterButton({ title, style, ...props }) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.footerButton, { opacity: props.disabled ? 0.4 : 1 }, style]}
      {...props}>
      <Text style={[styles.footerButtonTitle, { color: theme.text.info }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const HORIZONTAL_MARGIN = 20;

const styles = StyleSheet.create({
  footerButtonTitle: {
    fontSize: 16,
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
  },
  label: {
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
