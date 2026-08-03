import {
  type NativeStackNavigationOptions,
  type NativeStackNavigationProp,
  useNavigation,
} from 'expo-router';
import Fuse from 'fuse.js';
import React from 'react';
import { Platform } from 'react-native';
import type { SearchBarCommands } from 'react-native-screens';

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
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
  const { theme } = useTheme();
  const [query, setQuery] = React.useState('');
  const searchBarRef = React.useRef<SearchBarCommands>(null);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerSearchBarOptions: {
        ref: searchBarRef,
        placeholder: 'Search',
        autoFocus: true,
        // Without this iOS hides the navigation bar while searching, which slides the results
        // under the search field and swallows taps on the first row.
        hideNavigationBar: false,
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

  // `autoFocus` is Android-only, so focus the iOS search bar once the screen finishes opening.
  React.useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }
    return navigation.addListener('transitionEnd', ({ data }) => {
      if (!data.closing) {
        searchBarRef.current?.focus();
      }
    });
  }, [navigation]);

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
