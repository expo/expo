import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import Fuse from 'fuse.js';
import React from 'react';

import ComponentListScreen from './ComponentListScreen';
import { useTheme } from '../../../common/ThemeProvider';
import ExpoAPIIcon from '../components/ExpoAPIIcon';
import { screenApiItems as ApiScreenApiItems } from '../navigation/ExpoApisStackNavigator';
import { screenApiItems as ComponentScreenApiItems } from '../navigation/ExpoComponentsStackNavigator';

const fuse = new Fuse(ApiScreenApiItems.concat(ComponentScreenApiItems), { keys: ['name'] });

function SearchScreen({ navigation }: NativeStackScreenProps<SearchStack, 'search'>) {
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

type SearchStack = {
  search: undefined;
};

const Stack = createNativeStackNavigator<SearchStack>();

export default function SearchScreenStack() {
  const { theme } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.background.default },
        headerTintColor: theme.icon.info,
        headerTitleStyle: { color: theme.text.default },
      }}>
      <Stack.Screen name="search" component={SearchScreen} options={{ title: 'Search' }} />
    </Stack.Navigator>
  );
}
