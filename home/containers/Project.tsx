import { useQuery } from '@apollo/client';
import { StackScreenProps } from '@react-navigation/stack';
import gql from 'graphql-tag';
import { AllStackRoutes } from 'navigation/Navigation.types';
import * as React from 'react';

import ProjectView from '../components/ProjectView';

export interface ProjectUpdateUpdate {
  id: string;
  group: string;
  message: string;
  createdAt: Date;
  runtimeVersion: string;
  platform: 'android' | 'ios';
}

export interface ProjectUpdateBranch {
  id: string;
  name: string;
  updates: ProjectUpdateUpdate[];
}

export interface ProjectUpdateChannel {
  id: string;
  name: string;
  updateBranches: ProjectUpdateBranch[];
}

export type ProjectDataProject = {
  id: string;
  name: string;
  slug: string;
  fullName: string;
  username: string;
  published: string;
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
  updateChannels: ProjectUpdateChannel[];
};

export interface ProjectData {
  app: { byId: ProjectDataProject };
}

interface ProjectVars {
  appId: string;
}

export const ProjectPageQuery = gql`
  query WebContainerProjectPage_Query($appId: String!) {
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
        updateChannels(limit: 10000, offset: 0) {
          id
          name
          updateBranches(limit: 10000, offset: 0) {
            id
            name
            updates(limit: 10000, offset: 0) {
              id
              group
              message
              createdAt
              runtimeVersion
              platform
            }
          }
        }
      }
    }
  }
`;

export function ProjectContainer(props: ProjectVars & StackScreenProps<AllStackRoutes, 'Project'>) {
  const query = useQuery<ProjectData, ProjectVars>(ProjectPageQuery, {
    fetchPolicy: 'cache-and-network',
    variables: {
      appId: props.appId,
    },
  });
  return <ProjectView {...props} {...query} />;
}
