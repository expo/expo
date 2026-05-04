import AsyncStorage from '@react-native-async-storage/async-storage';
import { Checkbox } from 'expo-checkbox';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '../../common/ThemeProvider';
import { getTestModules, Module } from '../TestModules';
import {
  createQueryString,
  getScreenIdForLinking,
  getSelectedTestNames,
} from './getScreenIdForLinking';
import FooterBar from '../components/FooterBar';
import PlatformTouchable from '../components/PlatformTouchable';
import { routeNames } from '../constants/routeNames';

const supportsGlass = isLiquidGlassAvailable();
const SELECTION_STORAGE_KEY = 'test-suite:selected-modules';

function ListItem({
  title,
  onPressItem,
  selected,
  id,
}: {
  title: string;
  onPressItem: (id: string) => void;
  selected: boolean;
  id: string;
}) {
  const { theme } = useTheme();
  const onPress = () => onPressItem(id);

  return (
    <PlatformTouchable onPress={onPress}>
      <View style={[styles.listItem, { borderBottomColor: theme.border.secondary }]}>
        <Text style={[styles.label, { color: theme.text.default }]}>{title}</Text>
        <View style={{ pointerEvents: 'none' }}>
          <Checkbox color={theme.icon.info} value={selected} />
        </View>
      </View>
    </PlatformTouchable>
  );
}

export default function SelectScreen({ navigation }) {
  const { theme } = useTheme();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modules, setModules] = useState<Module[]>([]);
  const [footerHeight, setFooterHeight] = useState(0);

  const onFooterLayout = useCallback((e) => {
    setFooterHeight(e.nativeEvent.layout.height);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(SELECTION_STORAGE_KEY).then((value) => {
      if (value) {
        try {
          setSelected(new Set(JSON.parse(value)));
        } catch {}
      }
    });
  }, []);

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    AsyncStorage.setItem(SELECTION_STORAGE_KEY, JSON.stringify([...selected]));
  }, [selected]);

  const handleOpenURL = useCallback(
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

      setModules(getTestModules());
    },
    [navigation]
  );

  useEffect(() => {
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

  const keyExtractor = useCallback(({ name }) => name, []);

  const onPressItem = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Module }) => {
      const { name } = item;
      const id = getScreenIdForLinking(item);
      return (
        <ListItem id={id} onPressItem={onPressItem} selected={selected.has(id)} title={name} />
      );
    },
    [onPressItem, selected]
  );

  const selectAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === modules.length) {
        return new Set<string>();
      }
      return new Set<string>(modules.map(getScreenIdForLinking));
    });
  }, [modules]);

  const navigateToTests = useCallback(() => {
    if (selected.size === 0) {
      return;
    }
    const query = createQueryString(Array.from(selected.values()));
    navigation.navigate(routeNames.run, { tests: query });
  }, [selected, navigation]);

  const allSelected = selected.size === modules.length;
  const buttonTitle = allSelected ? 'Deselect all' : 'Select all';

  const footer = (
    <FooterBar>
      <TouchableOpacity onPress={selectAll}>
        <Text style={[styles.footerButtonText, { color: theme.text.link }]}>{buttonTitle}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={navigateToTests}
        disabled={selected.size === 0}
        style={{ opacity: selected.size === 0 ? 0.4 : 1 }}>
        <Text style={[styles.footerButtonText, { color: theme.text.link }]}>
          {selected.size > 0 ? `Run tests (${selected.size})` : 'Run tests'}
        </Text>
      </TouchableOpacity>
    </FooterBar>
  );

  return (
    <View style={styles.container}>
      <FlatList<Module>
        data={modules}
        extraData={selected}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        initialNumToRender={15}
        style={{ flex: 1, backgroundColor: theme.background.screen }}
        contentContainerStyle={supportsGlass ? { paddingBottom: footerHeight } : undefined}
      />
      <View style={supportsGlass ? styles.footerOverlay : undefined} onLayout={onFooterLayout}>
        {footer}
      </View>
    </View>
  );
}

const HORIZONTAL_MARGIN = 20;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  footerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  listItem: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: HORIZONTAL_MARGIN,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: {
    flex: 1,
    fontSize: 16,
  },
});
