/* @flow */

import React from 'react';
import { View, Text } from 'react-native';
import MyProjectsListContainer from '../containers/MyProjectsListContainer';
import OtherUserProjectListContainer
  from '../containers/OtherUserProjectListContainer';

export default class ProjectsForUserScreen extends React.Component {
  static route = {
    navigationBar: {
      title: 'Projects',
    },
  };

  render() {
    if (this.props.belongsToCurrentUser) {
      return <MyProjectsListContainer belongsToCurrentUser />;
    } else {
      return <OtherUserProjectListContainer username={this.props.username} />;
    }
  }
}
