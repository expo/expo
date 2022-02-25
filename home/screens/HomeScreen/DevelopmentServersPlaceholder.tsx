import { Text } from 'expo-dev-client-components';
import * as React from 'react';

type Props = {
  isAuthenticated: boolean;
};

export function DevelopmentServersPlaceholder({ isAuthenticated }: Props) {
  const message = isAuthenticated
    ? 'No projects are currently open.'
    : 'Sign in to your Expo account to see the projects you have recently been working on.';

  return <Text>{message}</Text>;
}
