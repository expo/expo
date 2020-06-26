/* @flow */

import React from 'react';

import MyProjectsListContainer from '../containers/MyProjectsListContainer';
import OtherUserProjectListContainer from '../containers/OtherUserProjectListContainer';

export default class ProjectsForUserScreen extends React.Component {
  static navigationOptions = {
    title: 'Projects',
  };

  render() {
    const username = this.props.navigation.getParam('username');
    const belongsToCurrentUser = this.props.navigation.getParam('belongsToCurrentUser', false);

    if (belongsToCurrentUser) {
      return <MyProjectsListContainer belongsToCurrentUser />;
    } else {
      return <OtherUserProjectListContainer username={username} />;
    }
  }
}
