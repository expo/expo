import { useQuery } from '@apollo/client';
import { getRuntimeVersionForSDKVersion } from '@expo/sdk-runtime-versions';
import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';
import { Platform } from 'react-native';

import ProjectView from '../components/ProjectView';
import { AppPlatform, WebContainerProjectPage_QueryDocument } from '../graphql/types';
import * as Kernel from '../kernel/Kernel';
import { AllStackRoutes } from '../navigation/Navigation.types';

export interface ProjectUpdate {
  id: string;
  group: string;
  message?: string | null;
  createdAt: Date;
  runtimeVersion: string;
  platform: string;
  manifestPermalink: string;
}

export interface ProjectUpdateBranch {
  id: string;
  name: string;
  updates: ProjectUpdate[];
}

export type ProjectDataProject = {
  id: string;
  name: string;
  slug: string;
  fullName: string;
  username: string;
  published: boolean;
  description: string;
  githubUrl?: string | null;
  playStoreUrl?: string | null;
  appStoreUrl?: string | null;
  sdkVersion: string;
  iconUrl?: string | null;
  privacy: string;
  icon?: {
    url: string;
    primaryColor?: string;
    colorPalette?: object;
  } | null;
  latestReleaseForReleaseChannel?: {
    sdkVersion: string;
    runtimeVersion?: string | null;
  } | null;
  updateBranches: ProjectUpdateBranch[];
};

export interface ProjectData {
  app?: { byId: ProjectDataProject } | null;
}

export function ProjectContainer(
  props: { appId: string } & StackScreenProps<AllStackRoutes, 'Project'>
) {
  const query = useQuery(WebContainerProjectPage_QueryDocument, {
    fetchPolicy: 'cache-and-network',
    variables: {
      appId: props.appId,
      platform: Platform.OS === 'ios' ? AppPlatform.Ios : AppPlatform.Android,
      runtimeVersions: Kernel.sdkVersions
        .split(',')
        .map((kernelSDKVersion) => getRuntimeVersionForSDKVersion(kernelSDKVersion)),
    },
  });
  return <ProjectView {...props} {...query} />;
}
