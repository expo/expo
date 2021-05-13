import { useQuery } from '@apollo/client';
import { getRuntimeVersionForSDKVersion } from '@expo/sdk-runtime-versions';
import { StackScreenProps } from '@react-navigation/stack';
import gql from 'graphql-tag';
import { AllStackRoutes } from 'navigation/Navigation.types';
import * as React from 'react';
import { Platform } from 'react-native';

import ProjectView from '../components/ProjectView';
import * as Kernel from '../kernel/Kernel';

export interface ProjectUpdate {
  id: string;
  group: string;
  message: string;
  createdAt: Date;
  runtimeVersion: string;
  platform: 'android' | 'ios';
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
  githubUrl?: string;
  playStoreUrl?: string;
  appStoreUrl?: string;
  sdkVersion: string;
  iconUrl?: string;
  privacy: string;
  icon?: {
    url: string;
    primaryColor?: string;
    colorPalette?: object;
  };
  updateBranches: ProjectUpdateBranch[];
};

export interface ProjectData {
  app: { byId: ProjectDataProject };
}

interface ProjectVars {
  appId: string;
  platform: 'ANDROID' | 'IOS';
  runtimeVersions: string[];
}

export const ProjectPageQuery = gql`
  query WebContainerProjectPage_Query(
    $appId: String!
    $platform: AppPlatform!
    $runtimeVersions: [String!]!
  ) {
    app {
      byId(appId: $appId) {
        id
        name
        slug
        fullName
        username
        published
        description
        githubUrl
        playStoreUrl
        appStoreUrl
        sdkVersion
        iconUrl
        privacy
        icon {
          url
        }
        updateBranches(limit: 100, offset: 0) {
          id
          name
          updates(
            limit: 1
            offset: 0
            filter: { platform: $platform, runtimeVersions: $runtimeVersions }
          ) {
            id
            group
            message
            createdAt
            runtimeVersion
            platform
            manifestPermalink
          }
        }
      }
    }
  }
`;

export function ProjectContainer(
  props: { appId: string } & StackScreenProps<AllStackRoutes, 'Project'>
) {
  const query = useQuery<ProjectData, ProjectVars>(ProjectPageQuery, {
    fetchPolicy: 'cache-and-network',
    variables: {
      appId: props.appId,
      platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
      runtimeVersions: Kernel.sdkVersions
        .split(',')
        .map(kernelSDKVersion => getRuntimeVersionForSDKVersion(kernelSDKVersion)),
    },
  });
  return <ProjectView {...props} {...query} />;
}
