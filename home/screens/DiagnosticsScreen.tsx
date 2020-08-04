import * as React from 'react';
import { StyleSheet } from 'react-native';

import BouncingShadowButton from '../components/BouncingShadowButton';
import ScrollView from '../components/NavigationScrollView';
import { StyledText } from '../components/Text';
import Environment from '../utils/Environment';

export default function DiagnosticsScreen({ navigation }) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 15 }}>
      <AudioDiagnostic navigation={navigation} />
      {Environment.IsIOSRestrictedBuild ? (
        <ForegroundLocationDiagnostic navigation={navigation} />
      ) : (
        <BackgroundLocationDiagnostic navigation={navigation} />
      )}
      <GeofencingDiagnostic navigation={navigation} />
    </ScrollView>
  );
}

function AudioDiagnostic({ navigation }) {
  return (
    <BouncingShadowButton onPress={() => navigation.navigate('Audio')}>
      <StyledText style={styles.titleText}>Audio</StyledText>
      <StyledText style={styles.bodyText}>
        On iOS you can play audio
        {!Environment.IsIOSRestrictedBuild ? ` in the foreground and background` : ``}, choose
        whether it plays when the device is on silent, and set how the audio interacts with audio
        from other apps. This diagnostic allows you to see the available options.
      </StyledText>
    </BouncingShadowButton>
  );
}

function BackgroundLocationDiagnostic({ navigation }) {
  return (
    <BouncingShadowButton onPress={() => navigation.navigate('Location')}>
      <StyledText style={styles.titleText}>Background location</StyledText>
      <StyledText style={styles.bodyText}>
        On iOS it's possible to track your location when an app is foregrounded, backgrounded, or
        even closed. This diagnostic allows you to see what options are available, see the output,
        and test the functionality on your device. None of the location data will leave your device.
      </StyledText>
    </BouncingShadowButton>
  );
}

function ForegroundLocationDiagnostic({ navigation }) {
  return (
    <BouncingShadowButton onPress={() => navigation.navigate('Location')}>
      <StyledText style={styles.titleText}>Location (when app in use)</StyledText>
      <StyledText style={styles.bodyText}>
        On iOS, there are different permissions for tracking your location. This diagnostic allows
        you to see what options are available and test the functionality on your device while you
        are using the app (background location is available only in standalone apps). None of the
        location data will leave your device.
      </StyledText>
    </BouncingShadowButton>
  );
}

function GeofencingDiagnostic({ navigation }) {
  return (
    <BouncingShadowButton onPress={() => navigation.navigate('Geofencing')}>
      <StyledText style={styles.titleText}>Geofencing</StyledText>
      <StyledText style={styles.bodyText}>
        You can fire actions when your device enters specific geographical regions represented by a
        longitude, latitude, and a radius. This diagnostic lets you experiment with Geofencing using
        regions that you specify and shows you the data that is made available. None of the data
        will leave your device.
      </StyledText>
    </BouncingShadowButton>
  );
}

const styles = StyleSheet.create({
  titleText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.6,
  },
});
