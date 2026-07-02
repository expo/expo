import { StackNavigationProp } from '@react-navigation/stack';
import { Location } from 'expo-location/next';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import SimpleActionDemo from '../../../components/SimpleActionDemo';

export default function PermissionsScreen({
  navigation,
}: {
  navigation: StackNavigationProp<{ BackgroundLocationMap: undefined; Geofencing: undefined }>;
}) {
  return (
    <ScrollView style={styles.scrollView}>
      <SimpleActionDemo
        title="requestForegroundPermissionsAsync"
        action={() => Location.requestForegroundPermissionsAsync()}
      />
      <SimpleActionDemo
        title="getForegroundPermissionsAsync"
        action={() => Location.getForegroundPermissionsAsync()}
      />
      <SimpleActionDemo
        title="requestBackgroundPermissionsAsync"
        action={async () => Location.requestBackgroundPermissionsAsync()}
      />
      <SimpleActionDemo
        title="getBackgroundPermissionsAsync"
        action={() => Location.getBackgroundPermissionsAsync()}
      />
      <SimpleActionDemo
        title="hasServicesEnabledAsync"
        action={() => Location.hasServicesEnabledAsync()}
      />
    </ScrollView>
  );
}

PermissionsScreen.navigationOptions = {
  title: 'Location Permissions',
};

const styles = StyleSheet.create({
  scrollView: {
    paddingTop: 10,
  },
});
