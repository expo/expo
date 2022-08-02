import { createStackNavigator, HeaderBackButton, StackScreenProps } from '@react-navigation/stack';
import Fuse from 'fuse.js';
import React from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ExpoAPIIcon from '../components/ExpoAPIIcon';
import SearchBar from '../components/SearchBar';
import useTheme from '../theme/useTheme';
import ComponentListScreen from './ComponentListScreen';
import { ScreenItems as ApiScreenItems } from './ExpoApisScreen';
import { ScreenItems as ComponentScreenItems } from './ExpoComponentsScreen';

const fuse = new Fuse(ApiScreenItems.concat(ComponentScreenItems), { keys: ['name'] });

const APPBAR_HEIGHT = Platform.OS === 'ios' ? 50 : 56;
const TITLE_OFFSET = Platform.OS === 'ios' ? 70 : 56;

function Header({
  children,
  backButton,
  tintColor,
  navigation,
}: {
  children?: React.ReactNode;
  backButton?: boolean;
  tintColor?: string;
  navigation: any;
}) {
  const { theme } = useTheme();
  const { top } = useSafeAreaInsets();
  // @todo: this is static and we don't know if it's visible or not on iOS.
  // need to use a more reliable and cross-platform API when one exists, like
  // LayoutContext. We also don't know if it's translucent or not on Android
  // and depend on react-native-safe-area-view to tell us.
  const STATUSBAR_HEIGHT = top || 8;

  return (
    <Animated.View
      style={{
        backgroundColor: theme.background.default,
        shadowColor: 'transparent',
        elevation: 0,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border.default,
        paddingTop: STATUSBAR_HEIGHT,
        height: STATUSBAR_HEIGHT + APPBAR_HEIGHT,
      }}>
      <View style={styles.appBar}>
        <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}>
          {backButton && (
            <HeaderBackButton
              onPress={() => navigation.goBack()}
              pressColorAndroid={tintColor || '#fff'}
              tintColor={tintColor}
            />
          )}
          {children}
        </View>
      </View>
    </Animated.View>
  );
}

function SearchScreen({ route }: StackScreenProps<SearchStack, 'search'>) {
  const query = route?.params?.q ?? '';

  const apis = React.useMemo(() => fuse.search(query).map(({ item }) => item), [query]);

  const renderItemRight = React.useCallback(
    ({ name }: { name: string }) => (
      <ExpoAPIIcon name={name} style={{ marginRight: 10, marginLeft: 6 }} />
    ),
    []
  );

  return <ComponentListScreen renderItemRight={renderItemRight} apis={apis} />;
}

type SearchStack = {
  search: { q?: string };
};

const Stack = createStackNavigator<SearchStack>();

export default () => {
  const { theme } = useTheme();
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="search"
        component={SearchScreen}
        options={({ navigation, route }) => ({
          headerStyle: {
            backgroundColor: theme.background.default,
          },
          header: () => (
            <Header
              navigation={navigation}
              tintColor={theme.link.default}
              backButton={Platform.OS === 'android'}>
              <SearchBar
                initialValue={route?.params?.q ?? ''}
                onChangeQuery={(q) => navigation.setParams({ q })}
                underlineColorAndroid={theme.background.secondary}
                tintColor={theme.link.default}
                textColor={theme.text.default}
                placeholderTextColor={theme.icon.secondary}
              />
            </Header>
          ),
        })}
      />
    </Stack.Navigator>
  );
};

const styles = {
  appBar: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
  },
  item: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  title: {
    bottom: 0,
    left: TITLE_OFFSET,
    right: TITLE_OFFSET,
    top: 0,
    position: 'absolute',
    alignItems: Platform.OS === 'ios' ? 'center' : 'flex-start',
  },
  left: {
    left: 0,
    bottom: 0,
    top: 0,
    position: 'absolute',
  },
  right: {
    right: 0,
    bottom: 0,
    top: 0,
    position: 'absolute',
  },
};
