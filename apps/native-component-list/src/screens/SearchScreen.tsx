import { HeaderBackButton } from '@react-navigation/elements';
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack';
import { useTheme } from 'ThemeProvider';
import Fuse from 'fuse.js';
import React from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ComponentListScreen from './ComponentListScreen';
import { ScreenItems as ApiScreenItems } from './ExpoApisScreen';
import { ScreenItems as ComponentScreenItems } from './ExpoComponentsScreen';
import ExpoAPIIcon from '../components/ExpoAPIIcon';
import SearchBar from '../components/SearchBar';

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
  const { top } = useSafeAreaInsets();
  // @todo: this is static and we don't know if it's visible or not on iOS.
  // need to use a more reliable and cross-platform API when one exists, like
  // LayoutContext. We also don't know if it's translucent or not on Android
  // and depend on react-native-safe-area-context to tell us.
  const STATUSBAR_HEIGHT = top || 8;

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: STATUSBAR_HEIGHT, height: STATUSBAR_HEIGHT + APPBAR_HEIGHT },
      ]}>
      <View style={styles.appBar}>
        <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}>
          {backButton && (
            <HeaderBackButton
              onPress={() => navigation.goBack()}
              pressColor={tintColor || '#fff'}
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

  return <ComponentListScreen renderItemRight={renderItemRight} apis={apis} sort={false} />;
}

type SearchStack = {
  search: { q?: string };
};

const Stack = createStackNavigator<SearchStack>();

export default function SearchScreenStack() {
  const { theme } = useTheme();
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="search"
        component={SearchScreen}
        options={({ navigation, route }) => ({
          header: () => (
            <Header
              navigation={navigation}
              tintColor={theme.icon.info}
              backButton={Platform.OS === 'android'}>
              <SearchBar
                initialValue={route?.params?.q ?? ''}
                onChangeQuery={(q) => navigation.setParams({ q })}
                underlineColorAndroid="#fff"
                tintColor={theme.text.info}
              />
            </Header>
          ),
        })}
      />
    </Stack.Navigator>
  );
}

const styles = {
  container: {
    backgroundColor: '#fff',

    ...Platform.select({
      ios: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#A7A7AA',
      },
      default: {
        shadowColor: 'black',
        shadowOpacity: 0.1,
        shadowRadius: StyleSheet.hairlineWidth,
        shadowOffset: {
          width: 0,
          height: StyleSheet.hairlineWidth,
        },
        elevation: 4,
      },
    }),
  },
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
