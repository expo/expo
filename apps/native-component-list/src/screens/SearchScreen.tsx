import { type NativeStackNavigationOptions, useNavigation } from 'expo-router';
import Fuse from 'fuse.js';
import React from 'react';

import { ThemeType, useTheme } from '../../../common/ThemeProvider';
import ExpoAPIIcon from '../components/ExpoAPIIcon';
import { screenApiItems as ApiScreenApiItems } from '../navigation/apiScreens';
import { screenApiItems as ComponentScreenApiItems } from '../navigation/componentScreens';
import ComponentListScreen from './ComponentListScreen';

const fuse = new Fuse(ApiScreenApiItems.concat(ComponentScreenApiItems), { keys: ['name'] });

// The header (with the native search bar) comes from the stack that renders this screen,
// so hosts must apply `getSearchScreenOptions` to that stack screen.
export function getSearchScreenOptions(theme: ThemeType): NativeStackNavigationOptions {
  return {
    title: 'Search',
    headerShown: true,
    headerStyle: { backgroundColor: theme.background.default },
    headerTintColor: theme.icon.info,
    headerTitleStyle: { color: theme.text.default },
  };
}

export default function SearchScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [query, setQuery] = React.useState('');

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerSearchBarOptions: {
        placeholder: 'Search',
        autoFocus: true,
        textColor: theme.text.default,
        tintColor: theme.icon.info,
        headerIconColor: theme.icon.secondary,
        hintTextColor: theme.text.quaternary,
        onChangeText: (event: { nativeEvent: { text: string } }) =>
          setQuery(event.nativeEvent.text),
        onCancelButtonPress: () => navigation.goBack(),
      },
    });
  }, [navigation, theme]);

  const apis = React.useMemo(() => {
    if (!query) return [];
    return fuse.search(query).map(({ item }) => item);
  }, [query]);

  const renderItemRight = React.useCallback(
    ({ name }: { name: string }) => (
      <ExpoAPIIcon name={name} style={{ marginRight: 10, marginLeft: 6 }} />
    ),
    []
  );

  return <ComponentListScreen renderItemRight={renderItemRight} apis={apis} sort={false} />;
}
