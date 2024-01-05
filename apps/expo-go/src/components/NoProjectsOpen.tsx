import * as React from 'react';

import ListItem from './ListItem';

type Props = {
  isAuthenticated: boolean;
};

export default function NoProjectsOpen(props: Props) {
  const { isAuthenticated } = props;
  const message = isAuthenticated
    ? 'No projects are currently open.'
    : 'Sign in to your Expo account to see the projects you have recently been working on.';

  return <ListItem subtitle={message} last style={{ paddingVertical: 15 }} />;
}
