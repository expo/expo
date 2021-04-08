import * as Facebook from 'expo-facebook';
import React from 'react';
import { Text, Platform, ScrollView, View } from 'react-native';

import ListButton from '../components/ListButton';
import HeadingText from '../components/HeadingText';
import SimpleActionDemo from '../components/SimpleActionDemo';

const appId = '629712900716487';
const appEventsDashboardUrlExpoGoIos =
  'https://www.facebook.com/events_manager2/list/app/1696089354000816/test_events?act=453712715268302';
const appEventsDashboardUrlAndroid =
  'https://www.facebook.com/events_manager2/list/app/629712900716487/test_events?act=453712715268302';

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
            })
          }
          title="Log an event"
        />
        <ListButton
          onPress={async () =>
            await Facebook.logPurchaseAsync(29, 'usd', { myParam: 'thanks for testing this!' })
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

        <View>
          <HeadingText style={{ textAlign: 'center' }}>
            To view app events in Expo Go on iOS, go to this dashboard:
          </HeadingText>
          <Text selectable style={{ textAlign: 'center' }}>
            {appEventsDashboardUrlExpoGoIos}
          </Text>

          <HeadingText style={{ textAlign: 'center' }}>
            To view app events in Expo Go on Android, and in standalones on iOS & Android, go to
            this dashboard:
          </HeadingText>
          <Text selectable style={{ textAlign: 'center' }}>
            {appEventsDashboardUrlAndroid}
          </Text>
        </View>
      </ScrollView>
    );
  }
}
