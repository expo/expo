import { useObserve } from 'expo-observe';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { FlatList, StyleSheet, Text, TouchableHighlight, View } from 'react-native';

import { optionalRequire } from '../../navigation/routeBuilder';
import { type ScreenConfig } from '../../types/ScreenConfig';

export const ScreensExampleScreens: ScreenConfig[] = [
  {
    name: 'ScreensContainer',
    route: 'screens/container',
    options: { title: 'ScreenContainer example' },
    getComponent() {
      return optionalRequire(() => require('./container'));
    },
  },
  {
    name: 'ScreensNativeStack',
    route: 'screens/native-stack',
    options: { title: 'ScreenStack example' },
    getComponent() {
      return optionalRequire(() => require('./nativeStack'));
    },
  },
  {
    name: 'ScreensNavigation',
    route: 'screens/navigation',
    options: { title: 'React Navigation example' },
    getComponent() {
      return optionalRequire(() => require('./navigation'));
    },
  },
];

function ScreensScreen() {
  const { markInteractive } = useObserve();
  useEffect(() => {
    markInteractive();
  }, [markInteractive]);
  return (
    <FlatList
      style={styles.list}
      data={ScreensExampleScreens}
      ItemSeparatorComponent={ItemSeparator}
      keyExtractor={(item) => item.name}
      renderItem={({ item }) => (
        <MainScreenItem
          title={(item.options as { title: string }).title}
          onPress={() => router.push(`/components/${item.route}`)}
        />
      )}
    />
  );
}

const ItemSeparator = () => <View style={styles.separator} />;

function MainScreenItem({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <TouchableHighlight onPress={onPress}>
      <View style={styles.button}>
        <Text style={styles.buttonText}>{title}</Text>
      </View>
    </TouchableHighlight>
  );
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: '#EFEFF4',
  },
  separator: {
    height: 1,
    backgroundColor: '#DBDBE0',
  },
  buttonText: {
    backgroundColor: 'transparent',
  },
  button: {
    flex: 1,
    height: 60,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default ScreensScreen;
