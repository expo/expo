import { StackNavigationProp } from '@react-navigation/stack';
import * as Location from 'expo-location';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import ListButton from '../../components/ListButton';
import SimpleActionDemo from '../../components/SimpleActionDemo';

type Subscription = { remove: () => any };
type SubscriptionDemoProps = {
  title: string;
  subscribe: (setValue: (value: any) => any) => Subscription | Promise<Subscription>;
};

function SubscriptionDemo(props: SubscriptionDemoProps) {
  const [subscription, setSubscription] = React.useState<Subscription | null>(null);

  const toggle = React.useCallback(
    async (setValue) => {
      if (subscription) {
        setValue(undefined);
        subscription.remove();
        setSubscription(null);
      } else {
        setSubscription(await props.subscribe(setValue));
      }
    },
    [subscription]
  );

  React.useEffect(() => {
    return () => {
      subscription?.remove();
    };
  }, [subscription]);

  return <SimpleActionDemo title={props.title} action={toggle} />;
}

export default class LocationScreen extends React.Component<{
  navigation: StackNavigationProp<{ BackgroundLocationMap: undefined; Geofencing: undefined }>;
}> {
  static navigationOptions = {
    title: 'Location',
  };

  _goToGeofencingMap = () => {
    this.props.navigation.navigate('Geofencing');
  };

  renderLocationMapButton() {
    return (
      <View style={{ marginTop: 30, paddingHorizontal: 10 }}>
        <ListButton onPress={this._goToGeofencingMap} title="Geofencing map" />
      </View>
    );
  }

  render() {
    return (
      <ScrollView style={styles.scrollView}>
        <SimpleActionDemo
          title="requestPermissionsAsync (legacy)"
          action={() => Location.requestPermissionsAsync()}
        />
        <SimpleActionDemo
          title="getPermissionsAsync (legacy)"
          action={() => Location.getPermissionsAsync()}
        />
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
        <SimpleActionDemo
          title="getProviderStatusAsync"
          action={() => Location.getProviderStatusAsync()}
        />
        <SimpleActionDemo
          title="getCurrentPositionAsync – lowest accuracy"
          action={() =>
            Location.getCurrentPositionAsync({ accuracy: Location.LocationAccuracy.Lowest })
          }
        />
        <SimpleActionDemo
          title="getCurrentPositionAsync – balanced accuracy"
          action={() => Location.getCurrentPositionAsync()}
        />
        <SimpleActionDemo
          title="getLastKnownPositionAsync"
          action={() => Location.getLastKnownPositionAsync()}
        />
        <SubscriptionDemo
          title="watchPositionAsync"
          subscribe={(setValue) => Location.watchPositionAsync({}, setValue)}
        />
        <SimpleActionDemo title="getHeadingAsync" action={() => Location.getHeadingAsync()} />
        <SubscriptionDemo
          title="watchHeadingAsync"
          subscribe={(setValue) => Location.watchHeadingAsync(setValue)}
        />
        {this.renderLocationMapButton()}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  scrollView: {
    paddingTop: 10,
  },
});
