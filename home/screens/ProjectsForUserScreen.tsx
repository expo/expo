import * as React from 'react';

import MyProjectsListContainer from '../containers/MyProjectsListContainer';
import OtherUserProjectListContainer from '../containers/OtherUserProjectListContainer';

export default function ProjectsForUserScreen({ navigation }: { navigation: any }) {
  const username = navigation.getParam('username');
  const belongsToCurrentUser = navigation.getParam('belongsToCurrentUser', false);

  if (belongsToCurrentUser) {
    return <MyProjectsListContainer belongsToCurrentUser />;
  } else {
    return <OtherUserProjectListContainer username={username} />;
  }
}

ProjectsForUserScreen.navigationOptions = {
  title: 'Projects',
};
