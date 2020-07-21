import * as React from 'react';

import MySnacksListContainer from '../containers/MySnacksListContainer';
import OtherUserSnackListContainer from '../containers/OtherUserSnackListContainer';

export default function SnacksForUserScreen({ navigation }: { navigation: any }) {
  const username = navigation.getParam('username');
  const belongsToCurrentUser = navigation.getParam('belongsToCurrentUser', false);

  if (belongsToCurrentUser) {
    return <MySnacksListContainer belongsToCurrentUser />;
  } else {
    return <OtherUserSnackListContainer username={username} />;
  }
}

SnacksForUserScreen.navigationOptions = {
  title: 'Snacks',
};
