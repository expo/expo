import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { HeaderStyleInterpolators } from '@react-navigation/stack';
import { ThemeType } from 'ThemeProvider';
import * as React from 'react';
import { View, Platform, TouchableOpacity, StyleSheet } from 'react-native';

export default function getStackConfig(navigation: BottomTabNavigationProp<any>, theme: ThemeType) {
  return {
    cardStyle: {
      backgroundColor: theme.background.default,
    },
    screenOptions: () => ({
      headerStyleInterpolator: HeaderStyleInterpolators.forUIKit,
      headerStyle: {
        backgroundColor: theme.background.default,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border.secondary,
        ...Platform.select({
          android: {
            elevation: 0,
          },
        }),
      },
      headerTintColor: theme.icon.info,
      headerTitleStyle: {
        color: theme.text.default,
      },
      headerPressColorAndroid: theme.icon.info,
      headerRight: () => <HeaderRightComponent navigation={navigation} theme={theme} />,
    }),
  };
}

const IS_NAV_PERSISTED = 'PERSIST_NAV_STATE';
const HeaderRightComponent = ({
  navigation,
  theme,
}: {
  navigation: BottomTabNavigationProp<any>;
  theme: ThemeType;
}) => {
  const [isNavPersisted, setIsNavPersisted] = React.useState(false);
  React.useEffect(() => {
    AsyncStorage.getItem(IS_NAV_PERSISTED).then((value) => setIsNavPersisted(!!value));
  }, []);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
        marginBottom: 4,
        gap: 14,
      }}>
      <TouchableOpacity
        onPress={() => {
          (isNavPersisted
            ? AsyncStorage.removeItem(IS_NAV_PERSISTED)
            : AsyncStorage.setItem(IS_NAV_PERSISTED, 'enabled')
          ).then(() => setIsNavPersisted(!isNavPersisted));
        }}>
        <Ionicons
          name={isNavPersisted ? 'lock-closed' : 'lock-open'}
          size={Platform.OS === 'ios' ? 22 : 25}
          color={isNavPersisted ? theme.icon.info : theme.icon.default}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('searchNavigator')}>
        <Ionicons name="search" size={Platform.OS === 'ios' ? 22 : 25} color={theme.icon.info} />
      </TouchableOpacity>
      {/* This toggler does not work properly, it only updates the navigation and not the body UI */}
      {/* <ThemeToggler /> */}
    </View>
  );
};
