import * as React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { NavigationInjectedProps } from 'react-navigation';
import { useDispatch, useSelector } from 'react-redux';

import ListItem from '../components/ListItem';
import ScrollView from '../components/NavigationScrollView';
import SectionFooter from '../components/SectionFooter';
import SectionHeader from '../components/SectionHeader';
import SessionActions from '../redux/SessionActions';
import SettingsActions from '../redux/SettingsActions';

type PreferredAppearance = 'light' | 'dark' | 'no-preference';

export default function UserSettingsScreen({ navigation }: NavigationInjectedProps) {
  return (
    <ScrollView
      style={styles.container}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="on-drag">
      <AppearanceItem />
      {Platform.OS === 'ios' && <MenuGestureItem />}
      <SignOutItem navigation={navigation} />
    </ScrollView>
  );
}

UserSettingsScreen.navigationOptions = {
  title: 'Options',
};

function AppearanceItem() {
  const dispatch = useDispatch();
  const preferredAppearance = useSelector(data => data.settings.preferredAppearance);

  const onSelectAppearance = React.useCallback(
    (preferredAppearance: PreferredAppearance) => {
      dispatch(SettingsActions.setPreferredAppearance(preferredAppearance));
    },
    [dispatch]
  );

  return (
    <View style={styles.marginTop}>
      <SectionHeader title="Theme" />
      <ListItem
        title="Automatic"
        checked={preferredAppearance === 'no-preference'}
        onPress={() => onSelectAppearance('no-preference')}
      />
      <ListItem
        title="Light"
        checked={preferredAppearance === 'light'}
        onPress={() => onSelectAppearance('light')}
      />
      <ListItem
        last
        margins={false}
        title="Dark"
        checked={preferredAppearance === 'dark'}
        onPress={() => onSelectAppearance('dark')}
      />
      <SectionFooter
        title="Automatic is only supported on operating systems that allow you to control the
            system-wide color scheme."
      />
    </View>
  );
}

function MenuGestureItem() {
  const dispatch = useDispatch();
  const devMenuSettings = useSelector(data => data.settings.devMenuSettings);

  const onToggleMotionGesture = React.useCallback(() => {
    dispatch(
      SettingsActions.setDevMenuSetting(
        'motionGestureEnabled',
        !devMenuSettings.motionGestureEnabled
      )
    );
  }, [dispatch, devMenuSettings]);

  const onToggleTouchGesture = React.useCallback(() => {
    dispatch(
      SettingsActions.setDevMenuSetting('touchGestureEnabled', !devMenuSettings.touchGestureEnabled)
    );
  }, [dispatch, devMenuSettings]);

  if (!devMenuSettings) {
    return null;
  }

  return (
    <View style={styles.marginTop}>
      <SectionHeader title="Developer Menu Gestures" />
      <ListItem
        title="Shake device"
        checked={devMenuSettings.motionGestureEnabled}
        onPress={onToggleMotionGesture}
      />
      <ListItem
        title="Three-finger long press"
        checked={devMenuSettings.touchGestureEnabled}
        onPress={onToggleTouchGesture}
      />
      <SectionFooter title="Selected gestures will toggle the developer menu while inside an experience. The menu allows you to reload or return to home in a published experience, and exposes developer tools in development mode." />
    </View>
  );
}

function SignOutItem({ navigation }: NavigationInjectedProps) {
  const dispatch = useDispatch();

  const onPress = React.useCallback(() => {
    dispatch(SessionActions.signOut());
    requestAnimationFrame(navigation.pop);
  }, [dispatch, navigation]);

  return <ListItem style={styles.marginTop} title="Sign Out" onPress={onPress} last />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  marginTop: {
    marginTop: 25,
  },
});
