import React from 'react';
import { StyleSheet, View, ScrollView, Text } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Permissions from 'expo-permissions';
import ButtonGroup from './src/ButtonGroup';
import getMainButtonList from './src/MainButtonGroup';
import getStickyGroupButtonList from './src/StickyGroup';
import getCategoryButtonslist from './src/CategoryGroup';
import getChannelButtonList from './src/ChannelGroup';
import getPushButtonList from './src/PushGroup';

export default class App extends React.Component {

  constructor(props) {
    super(props);

    this.state = { 
      initialUserInteraction: null,
      gotInformationAboutInitialUserInteraction: false,
    };

    Notifications.addOnForegroundNotificationListener('testScreen',
      (userInteraction: UserInteraction) => {
        console.log(userInteraction);
      }
    );
    Notifications.addOnUserInteractionListener('testScreen',
      (foregroundNotification: ForegroundNotififcation) => {
        console.log(foregroundNotification);
      }
    );
  }

  componentDidMount() {
    this._obtainUserFacingNotifPermissionsAsync();
    this._getInitialUserInteraction();
  }

  render() {
    if (!this.state.gotInformationAboutInitialUserInteraction) {
      return (
        <View>
          <Text>
            loading...
          </Text>     
        </View>
      )
    }

    return (
      <View>
        <ScrollView>
          <ButtonGroup title="Main list" buttonList={getMainButtonList()} />
          <ButtonGroup title="Sticky list" buttonList={getStickyGroupButtonList()} />
          <ButtonGroup title="Category List" buttonList={getCategoryButtonslist()} />
          <ButtonGroup title="Channel List" buttonList={getChannelButtonList()} />
          <ButtonGroup title="Push List" buttonList={getPushButtonList()} />
        </ScrollView>
      </View>
    );
  }

  _getInitialUserInteraction = async () => {
    const userInteraction = await Notifications.getInitialUserInteractionAsync();
    console.log(userInteraction);
    console.log(JSON.stringify(userInteraction));
    this.setState({
      gotInformationAboutInitialUserInteraction: true,
      initialUserInteraction: userInteraction,
    });
  }

  _obtainUserFacingNotifPermissionsAsync = async () => {
    let permission = await Permissions.getAsync(
      Permissions.USER_FACING_NOTIFICATIONS
    );
    if (permission.status !== 'granted') {
      permission = await Permissions.askAsync(
        Permissions.USER_FACING_NOTIFICATIONS
      );
      if (permission.status !== 'granted') {
        alert(`We don't have permission to present notifications.`);
      }
    }
    return permission;
  }

}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
});