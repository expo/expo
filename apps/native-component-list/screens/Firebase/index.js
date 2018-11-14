// @flow

import { Ionicons } from '@expo/vector-icons';
import { Contacts, ImagePicker, Permissions } from 'expo';
import React from 'react';
import { Platform, RefreshControl, StyleSheet, Text, View } from 'react-native';
import HeaderButtons from 'react-navigation-header-buttons';

import firebase from 'expo-firebase-app';

// import ContactsList from './ContactsList';
// import * as ContactUtils from './ContactUtils';

console.ignoredYellowBox = ['Require'];

const CONTACT_PAGE_SIZE = 500;

const isIos = Platform.OS === 'ios';

export default class ContactsScreen extends React.Component {
  static navigationOptions = () => {
    return {
      title: 'Contacts',
      headerRight: (
        <HeaderButtons
          IconComponent={Ionicons}
          OverflowIcon={<Ionicons name="ios-more" size={23} color="blue" />}
          iconSize={23}
          color="blue">
          <HeaderButtons.Item
            title="add"
            iconName="md-add"
            onPress={async () => {
              const randomContact = { note: 'Likes expo...' };

              //   ContactUtils.presentNewContactFormAsync({
              //     contact: randomContact,
              //   });
              // ContactUtils.presentUnknownContactFormAsync({
              //   contact: randomContact,
              // });
            }}
          />
        </HeaderButtons>
      ),
    };
  };

  _rawContacts = {};
  state = {
    contacts: [],
    hasPreviousPage: false,
    hasNextPage: false,
    permission: null,
    refreshing: false,
  };

  _setupNotifications = async () => {
    let { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
    if (status !== 'granted') {
      throw new Error('ERR: Need permission for notifications');
    }

    setTimeout(() => {
      console.log('demo module', firebase.analytics());
      firebase.analytics().logEvent('something', { foo: 'bar' });
    }, 200);

    return;
    this.notificationDisplayedListener = firebase
      .notifications()
      .onNotificationDisplayed(notification => {
        // Process your notification as required
        // ANDROID: Remote notifications do not contain the channel ID. You will have to specify this manually if you'd like to re-display the notification.
        console.log('onNotificationDisplayed', notification);
      });
    this.notificationListener = firebase.notifications().onNotification(notification => {
      // Process your notification as required
      console.log('onNotification', notification);
    });
    this.notificationOpenedListener = firebase
      .notifications()
      .onNotificationOpened(notificationOpen => {
        // Get the action triggered by the notification being opened
        const action = notificationOpen.action;
        // Get information about the notification that was opened
        const notification = notificationOpen.notification;
        console.log('onNotificationOpened', notificationOpen);
      });

    // this.messageListener = firebase.messaging().onMessage(message => {
    //   // Process your message as required
    //   console.log('onMessage', message);
    // });
    // this.onTokenRefreshListener = firebase.messaging().onTokenRefresh(fcmToken => {
    //   console.log('onTokenRefresh', fcmToken);
    //   // Process your token as required
    // });

    try {
      const notificationOpen: NotificationOpen = await firebase
        .notifications()
        .getInitialNotification();
      if (notificationOpen) {
        // App was opened by a notification
        // Get the action triggered by the notification being opened
        const action = notificationOpen.action;
        // Get information about the notification that was opened
        const notification: Notification = notificationOpen.notification;
        console.log({ action, notification });
      }
    } catch ({ message }) {
      console.log('Error: getInitialNotification: ' + message);
    }
  };
  componentWillUnmount() {
    // this.notificationDisplayedListener();
    // this.notificationListener();
    // this.notificationOpenedListener();
    // this.messageListener();
  }

  async componentDidMount() {
    this._setupNotifications();
    // await this.checkPermissionAsync();
    // await this.loadAsync();
  }

  checkPermissionAsync = async () => {
    const { status } = await Permissions.askAsync(Permissions.CONTACTS);
    this.setState({ permission: status === 'granted' });
  };

  loadAsync = async (restart = false) => {
    if (!this.state.permission || this.state.refreshing) {
      return;
    }
    this.setState({ refreshing: true });

    const pageOffset = restart ? 0 : this.state.contacts.length || 0;

    const pageSize = restart ? Math.max(pageOffset, CONTACT_PAGE_SIZE) : CONTACT_PAGE_SIZE;

    const payload = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.Name],
      sort: Contacts.SortTypes.LastName,
      pageSize,
      pageOffset,
    });

    const { data: contacts, hasPreviousPage, hasNextPage } = payload;
    for (const contact of contacts) {
      this._rawContacts[contact.id] = contact;
    }
    this.setState({
      contacts: Object.values(this._rawContacts),
      hasPreviousPage,
      hasNextPage,
      refreshing: false,
    });
  };

  onPressItem = async id => {
    console.log('onPress', id);
    this.props.navigation.navigate('ContactDetail', { id });
  };

  doIt = async detector => {
    // await Permissions.askAsync(Permissions.CAMERA_ROLL);
    // await Permissions.askAsync(Permissions.CAMERA);
    // //launchImageLibraryAsync
    // const { cancelled, ...image } = await ImagePicker.launchImageLibraryAsync(); //launchCameraAsync();
    // if (!cancelled) {
    //   // const results = await firebase.vision()[detector](image.uri);
    //   // console.log({ results });
    // }
  };

  render() {
    const { contacts, permission } = this.state;
    // if (!permission) {

    const detectors = ['barcode', 'face', 'label', 'landmark', 'text'];
    return (
      <View style={styles.permissionContainer}>
        {detectors.map(detector => (
          <Text key={detector} style={styles.text} onPress={() => this.doIt(detector)}>
            {detector}
          </Text>
        ))}
      </View>
    );
    // }
    // return <View style={styles.container} />;
  }
}

const styles = StyleSheet.create({
  button: {
    marginVertical: 10,
  },
  container: {
    flex: 1,
  },
  text: {
    padding: 12,
    margin: 8,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactRow: {
    marginBottom: 12,
  },
});
