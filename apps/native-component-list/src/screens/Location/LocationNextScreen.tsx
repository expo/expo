import { StackNavigationProp } from '@react-navigation/stack';
import { LocationNext } from 'expo-location';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import ListButton from '../../components/ListButton';
import SimpleActionDemo from '../../components/SimpleActionDemo';

const Location = LocationNext.LocationModuleNext;
const LocationProvider = Location.LocationProvider as any;

type SetValueType = (value: any) => any;
type Subscription = { remove: () => any };
type SubscriptionDemoProps = {
  title: string;
  subscribe: (setValue: SetValueType) => Subscription | Promise<Subscription>;
};

function SubscriptionDemo(props: SubscriptionDemoProps) {
  const [subscription, setSubscription] = React.useState<Subscription | null>(null);

  const toggle = React.useCallback(
    async (setValue: SetValueType) => {
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

export default function LocationScreen({
  navigation,
}: {
  navigation: StackNavigationProp<{ BackgroundLocationMap: undefined; Geofencing: undefined }>;
}) {
  return (
    <ScrollView style={styles.scrollView}>
      <SimpleActionDemo
        title="requestForegroundPermissionsAsync"
        action={() => LocationNext.LocationModuleNext.requestForegroundPermissionsAsync()}
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
        title="getCurrentPositionAsync – lowest accuracy"
        action={() => Location.getCurrentPositionAsync()}
      />
      <SimpleActionDemo
        title="getCurrentPositionAsync – balanced accuracy"
        action={() => Location.getCurrentPositionAsync()}
      />
      <SimpleActionDemo
        title="getLastKnownPositionAsync"
        action={() => Location.getLastKnownPositionAsync()}
      />
      <SimpleActionDemo
        title="setDefaultLocationProvider – Gms"
        action={() => Location.setDefaultLocationProvider(LocationProvider.Gms())}
      />
      <SimpleActionDemo
        title="setDefaultLocationProvider – Android"
        action={() => Location.setDefaultLocationProvider(LocationProvider.Android())}
      />
      <SimpleActionDemo
        title="setDefaultLocationProvider – Fallback"
        action={() => Location.setDefaultLocationProvider(LocationProvider.Fallback())}
      />
      <SubscriptionDemo
        title="watchPosition"
        subscribe={(setValue) => {
          const handle = Location.watchPosition();
          return handle.addListener('positionChanged', setValue);
        }}
      />

      <View style={{ marginTop: 30, paddingHorizontal: 10 }}>
        <ListButton onPress={() => navigation.navigate('Geofencing')} title="Geofencing map" />
      </View>
    </ScrollView>
  );
}

LocationScreen.navigationOptions = {
  title: 'Location',
};

const styles = StyleSheet.create({
  scrollView: {
    paddingTop: 10,
  },
});
