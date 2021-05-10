import { StackScreenProps } from '@react-navigation/stack';
import { AllStackRoutes } from 'navigation/Navigation.types';
import * as React from 'react';

import { ExperienceContainer } from '../containers/Experience';

export default function ExperienceScreen({
  navigation,
  ...props
}: StackScreenProps<AllStackRoutes, 'Experience'>) {
  const { username, slug } = props.route.params;

  return <ExperienceContainer username={username} slug={slug} />;
}
