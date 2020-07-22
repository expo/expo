import * as React from 'react';

import MySnacksListContainer from '../containers/MySnacksListContainer';
import OtherUserSnackListContainer from '../containers/OtherUserSnackListContainer';
import { StackScreenProps } from '@react-navigation/stack';

type Links = { SnacksForUser: { username: string; belongsToCurrentUser?: boolean } };

export default function SnacksForUserScreen({ route }: StackScreenProps<Links, 'SnacksForUser'>) {
  const { username, belongsToCurrentUser = false } = route.params ?? {};

  if (belongsToCurrentUser) {
    return <MySnacksListContainer belongsToCurrentUser />;
  }

  return <OtherUserSnackListContainer username={username} />;
}
