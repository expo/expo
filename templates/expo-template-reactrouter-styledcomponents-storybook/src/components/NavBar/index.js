import React from 'react';
import { Text } from 'react-native';
import { HomeLink, SettingsLink } from '../../navigation/routes';
import { NavBarContainer, NavBarItem } from './styledComponents';

const NavBar = () => {
  return (
    <NavBarContainer>
      <NavBarItem>
        <HomeLink><Text>Home</Text></HomeLink>
      </NavBarItem>
      <NavBarItem>
        <SettingsLink><Text>Settings</Text></SettingsLink>
      </NavBarItem>
    </NavBarContainer>
  )
}

export default NavBar;
