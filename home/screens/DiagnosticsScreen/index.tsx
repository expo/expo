import { spacing } from '@expo/styleguide-native';
import { StackNavigationProp, StackScreenProps } from '@react-navigation/stack';
import { Spacer } from 'expo-dev-client-components';
import * as React from 'react';

import ScrollView from '../../components/NavigationScrollView';
import { DiagnosticsStackRoutes } from '../../navigation/Navigation.types';
import Environment from '../../utils/Environment';
import { DiagnosticButton } from './DiagnosticsButton';

export function DiagnosticsScreen({
  navigation,
}: StackScreenProps<DiagnosticsStackRoutes, 'Diagnostics'>) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing[4] }}>
      <AudioDiagnostic navigation={navigation} />
      <Spacer.Vertical size="medium" />
      {Environment.IsIOSRestrictedBuild ? (
        <ForegroundLocationDiagnostic navigation={navigation} />
      ) : (
        <BackgroundLocationDiagnostic navigation={navigation} />
      )}
      <Spacer.Vertical size="medium" />
      <GeofencingDiagnostic navigation={navigation} />
    </ScrollView>
  );
}

function AudioDiagnostic({
  navigation,
}: {
  navigation: StackNavigationProp<DiagnosticsStackRoutes, 'Diagnostics'>;
}) {
  return (
    <DiagnosticButton
      title="Audio"
      description={`On iOS you can play audio ${
        !Environment.IsIOSRestrictedBuild ? ` in the foreground and background` : ``
      }, choose whether it plays when the device is on silent, and set how the audio interacts with audio from other apps. This diagnostic allows you to see the available options.`}
      onPress={() => navigation.navigate('Audio', {})}
    />
  );
}

function BackgroundLocationDiagnostic({
  navigation,
}: {
  navigation: StackNavigationProp<DiagnosticsStackRoutes, 'Diagnostics'>;
}) {
  return (
    <DiagnosticButton
      title="Background location"
      description="On iOS it's possible to track your location when an app is foregrounded, backgrounded, or even closed. This diagnostic allows you to see what options are available, see the output, and test the functionality on your device. None of the location data will leave your device."
      onPress={() => navigation.navigate('Location', {})}
    />
  );
}

function ForegroundLocationDiagnostic({
  navigation,
}: {
  navigation: StackNavigationProp<DiagnosticsStackRoutes, 'Diagnostics'>;
}) {
  return (
    <DiagnosticButton
      title="Location (when app in use)"
      description="On iOS, there are different permissions for tracking your location. This diagnostic allows you to see what options are available and test the functionality on your device while you are using the app (background location is available only in standalone apps). None of the location data will leave your device."
      onPress={() => navigation.navigate('Location', {})}
    />
  );
}

function GeofencingDiagnostic({
  navigation,
}: {
  navigation: StackNavigationProp<DiagnosticsStackRoutes, 'Diagnostics'>;
}) {
  return (
    <DiagnosticButton
      title="Geofencing"
      description="You can fire actions when your device enters specific geographical regions represented by a longitude, latitude, and a radius. This diagnostic lets you experiment with Geofencing using regions that you specify and shows you the data that is made available. None of the data will leave your device."
      onPress={() => navigation.navigate('Geofencing', {})}
    />
  );
}
