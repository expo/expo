import {
  isAvailable,
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
  getAdvertisingId,
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
          title="Is Tracking Transparency available?"
          action={() => isAvailable()}
        />
        <SimpleActionDemo
          title="Get tracking permissions"
          action={async () => await getTrackingPermissionsAsync()}
        />
        <SimpleActionDemo
          title="Request tracking permissions"
          action={async () => await requestTrackingPermissionsAsync()}
        />
        <SimpleActionDemo title="Get advertising ID" action={() => getAdvertisingId()} />
      </View>
    );
  }
}
