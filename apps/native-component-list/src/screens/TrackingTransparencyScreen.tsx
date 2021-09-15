import {
  requestTrackingPermissionsAsync,
  getTrackingPermissionsAsync,
  isAvailable,
} from 'expo-tracking-transparency';
import React from 'react';
import { View } from 'react-native';

import SimpleActionDemo from '../components/SimpleActionDemo';

export default class TrackingTransparencyScreen extends React.Component {
  static navigationOptions = {
    title: 'TrackingTransparency',
  };

  render() {
    return (
      <View style={{ padding: 10 }}>
        <SimpleActionDemo
          title="is Tracking Transparency available?"
          action={() => !!isAvailable()}
        />
        <SimpleActionDemo
          title="get tracking permissions"
          action={async () => await getTrackingPermissionsAsync()}
        />
        <SimpleActionDemo
          title="request tracking permissions"
          action={async () => await requestTrackingPermissionsAsync()}
        />
      </View>
    );
  }
}
