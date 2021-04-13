import { StackScreenProps } from '@react-navigation/stack';
import { AllStackRoutes } from 'navigation/Navigation.types';
import * as React from 'react';

import ProjectManifestLauncher from '../components/ProjectManifestLauncher';

export default function ProjectManifestLauncherScreen({
  route,
}: StackScreenProps<AllStackRoutes, 'ProjectManifestLauncher'>) {
  return <ProjectManifestLauncher {...route.params} />;
}
