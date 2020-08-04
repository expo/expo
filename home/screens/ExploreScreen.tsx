import * as React from 'react';

import { StyledView } from '../components/Views';
import Colors from '../constants/Colors';
import Explore from '../containers/Explore';
import { useIsAuthenticated } from '../utils/isUserAuthenticated';

export default function ExploreScreen() {
  const isAuthenticated = useIsAuthenticated();

  return (
    <StyledView
      style={{ flex: 1 }}
      darkBackgroundColor="#000"
      lightBackgroundColor={Colors.light.greyBackground}>
      <Explore filter="FEATURED" key={isAuthenticated ? 'authenticated' : 'guest'} />
    </StyledView>
  );
}
