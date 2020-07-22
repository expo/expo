import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';
import { useSelector } from 'react-redux';

import { StyledView } from '../components/Views';
import Colors from '../constants/Colors';
import ExploreTabContainer from '../containers/ExploreTabContainer';
import isUserAuthenticated from '../utils/isUserAuthenticated';

type Links = { Profile: { username: string } };

export default function ExploreScreen({ navigation }: StackScreenProps<Links, 'Profile'>) {
  const isAuthenticated = useSelector(data => isUserAuthenticated(data.session));

  const onUsernamePressed = React.useCallback(
    (username: string) => {
      navigation.push('Profile', { username });
    },
    [navigation]
  );

  return (
    <StyledView
      style={{ flex: 1 }}
      darkBackgroundColor="#000"
      lightBackgroundColor={Colors.light.greyBackground}>
      <ExploreTabContainer
        filter="FEATURED"
        key={isAuthenticated ? 'authenticated' : 'guest'}
        onPressUsername={onUsernamePressed}
      />
    </StyledView>
  );
}
