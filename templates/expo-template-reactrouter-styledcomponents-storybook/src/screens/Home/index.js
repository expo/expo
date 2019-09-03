import React from 'react';
import { Text } from 'react-native';
import BaseLayout from '../../layouts/BaseLayout';
import { SettingsLink } from '../../navigation/routes';
import { WelcomeText } from './styledComponents';

const HomeScreen = () => {
  return (
    <BaseLayout>
      <WelcomeText>Welcome Home!</WelcomeText>
      <SettingsLink><Text>Go to Settings</Text></SettingsLink>
    </BaseLayout>
  );
}

export default HomeScreen;
