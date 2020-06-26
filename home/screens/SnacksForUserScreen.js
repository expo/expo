/* @flow */

import React from 'react';

import MySnacksListContainer from '../containers/MySnacksListContainer';
import OtherUserSnackListContainer from '../containers/OtherUserSnackListContainer';

export default class SnacksForUserScreen extends React.Component {
  static navigationOptions = {
    title: 'Snacks',
  };

  render() {
    const username = this.props.navigation.getParam('username');
    const belongsToCurrentUser = this.props.navigation.getParam('belongsToCurrentUser', false);

    if (belongsToCurrentUser) {
      return <MySnacksListContainer belongsToCurrentUser />;
    } else {
      return <OtherUserSnackListContainer username={username} />;
    }
  }
}
