import React from 'react';
import { Text } from 'react-native';
import BaseLayout from '../../layouts/BaseLayout';
import { HomeLink } from '../../navigation/routes';
import { Heading } from './styledComponents';

const SettingsScreen = () => {
  return (
    <BaseLayout>
      <Heading>Settings Screen</Heading>
      <HomeLink><Text>Back</Text></HomeLink>
    </BaseLayout>
  );
}

export default SettingsScreen;
