import * as Facebook from 'expo-facebook';
import React from 'react';
import { Text, Platform, ScrollView, View } from 'react-native';

import HeadingText from '../components/HeadingText';
import ListButton from '../components/ListButton';
import SimpleActionDemo from '../components/SimpleActionDemo';

const appId = '1696089354000816';
const appEventsDashboardUrl =
  'https://www.facebook.com/events_manager2/list/app/1696089354000816/test_events?act=453712715268302';

export default class FacebookAppEventsScreen extends React.Component {
  static navigationOptions = {
    title: 'FacebookAppEvents',
  };

  render() {
    return (
      <ScrollView style={{ padding: 10 }}>
        <ListButton
          onPress={async () =>
            await Facebook.initializeAsync({ appId, version: Platform.select({ web: 'v5.0' }) })
          }
          title="Initialize Facebook SDK"
        />
        <SimpleActionDemo
          title="get tracking permissions"
          action={async () => await Facebook.getPermissionsAsync()}
        />
        <SimpleActionDemo
          title="request tracking permissions"
          action={async () => await Facebook.requestPermissionsAsync()}
        />

        <ListButton
          onPress={async () =>
            await Facebook.logEventAsync('NCL-event-test', {
              myParam: 'thanks for testing this!',
              // @ts-ignore
              'this is null': null,
              number: 5,
              double: 5.0,
            })
          }
          title="Log an event"
        />
        <ListButton
          onPress={async () =>
            await Facebook.logPurchaseAsync(29.99, 'usd', { myParam: 'thanks for testing this!' })
          }
          title="Log a purchase"
        />
        <ListButton
          onPress={async () => await Facebook.logPushNotificationOpenAsync('my capmaign')}
          title="Log a push notification open"
        />
        <ListButton
          onPress={async () => alert(await Facebook.getUserIDAsync())}
          title="Get user ID"
        />
        <ListButton
          onPress={async () => await Facebook.setUserIDAsync('123')}
          title="Set user ID to '123'"
        />
        <ListButton
          onPress={async () => alert(await Facebook.getAnonymousIDAsync())}
          title="Get anonymous ID"
        />
        <ListButton
          onPress={async () => alert(await Facebook.getAdvertiserIDAsync())}
          title="Get advertiser ID"
        />
        <ListButton
          onPress={async () => alert(await Facebook.getAttributionIDAsync())}
          title="Get attribution ID (android only)"
        />
        <ListButton
          onPress={async () => await Facebook.setUserDataAsync({ email: 'myemail@something.com' })}
          title="Set user data"
        />

        <ListButton onPress={async () => await Facebook.flushAsync()} title="Flush" />

        <View style={{ paddingBottom: 30 }}>
          <HeadingText style={{ textAlign: 'center' }}>
            To view app events from Expo Go, go to this dashboard:
          </HeadingText>
          <Text selectable style={{ textAlign: 'center' }}>
            {appEventsDashboardUrl}
          </Text>
        </View>
      </ScrollView>
    );
  }
}
