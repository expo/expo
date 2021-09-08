import { useNavigation } from '@react-navigation/native';
import * as Tracking from 'expo-tracking-transparency';
import * as WebBrowser from 'expo-web-browser';
import * as React from 'react';
import { Platform, StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { ColorSchemeName } from 'react-native-appearance';

import ListItem from '../components/ListItem';
import ScrollView from '../components/NavigationScrollView';
import SectionFooter from '../components/SectionFooter';
import SectionHeader from '../components/SectionHeader';
import Colors from '../constants/Colors';
import SharedStyles from '../constants/SharedStyles';
import { useDispatch, useSelector } from '../redux/Hooks';
import SessionActions from '../redux/SessionActions';
import SettingsActions from '../redux/SettingsActions';

export default function UserSettingsScreen() {
  return (
    <ScrollView
      style={styles.container}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="on-drag">
      <AppearanceItem />
      {Platform.OS === 'ios' && <MenuGestureItem />}
      {Tracking.isAvailable() && <TrackingItem />}
      <SignOutItem />
    </ScrollView>
  );
}

function AppearanceItem() {
  const dispatch = useDispatch();
  const preferredAppearance = useSelector((data) => data.settings.preferredAppearance);

  const onSelectAppearance = React.useCallback(
    (preferredAppearance: ColorSchemeName) => {
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
  const devMenuSettings = useSelector((data) => data.settings.devMenuSettings);

  const onToggleMotionGesture = React.useCallback(() => {
    dispatch(
      SettingsActions.setDevMenuSetting(
        'motionGestureEnabled',
        !devMenuSettings?.motionGestureEnabled
      )
    );
  }, [dispatch, devMenuSettings]);

  const onToggleTouchGesture = React.useCallback(() => {
    dispatch(
      SettingsActions.setDevMenuSetting(
        'touchGestureEnabled',
        !devMenuSettings?.touchGestureEnabled
      )
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

function TrackingItem() {
  const [showTrackingItem, setShowTrackingItem] = React.useState(false);
  React.useEffect(() => {
    (async () => {
      const { status } = await Tracking.getTrackingPermissionsAsync();
      setShowTrackingItem(status === 'undetermined');
    })();
  }, [showTrackingItem]);

  return showTrackingItem ? (
    <View style={styles.marginTop}>
      <SectionHeader title="Tracking" />
      <ListItem
        last
        margins={false}
        title="Allow access to app-related data for tracking"
        onPress={async () => {
          const { status } = await Tracking.requestTrackingPermissionsAsync();
          setShowTrackingItem(status === 'undetermined');
        }}
      />
      <TouchableOpacity onPress={handleLearnMorePress}>
        <View style={[SharedStyles.genericCardDescriptionContainer]}>
          <Text
            style={[SharedStyles.genericCardDescriptionText, { color: Colors.light.tintColor }]}>
            Learn more about what data Expo collects and why.
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  ) : null;
}

function handleLearnMorePress() {
  WebBrowser.openBrowserAsync('https://expo.io/privacy-explained');
}

function SignOutItem() {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const onPress = React.useCallback(() => {
    dispatch(SessionActions.signOut());
    requestAnimationFrame(navigation.goBack);
  }, [dispatch, navigation]);

  return (
    <View style={styles.marginTop}>
      <ListItem title="Sign Out" onPress={onPress} last />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  marginTop: {
    marginTop: 25,
  },
});
