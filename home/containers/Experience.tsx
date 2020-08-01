import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import * as React from 'react';

import ExperienceView from '../components/ExperienceView';
import { Experience } from '../components/ExperienceView.types';

interface ExperienceData {
  project: { project: Experience };
}

interface ExperienceVars {
  username: string;
  slug: string;
}

export const ExperiencePageQuery = gql`
  query WebContainerExperiencePage_Query($username: String!, $slug: String!) {
    project {
      project: byUsernameAndSlug(username: $username, slug: $slug) {
        id
        name
        slug
        fullName
        username
        published
        description
        ... on App {
          githubUrl
          playStoreUrl
          appStoreUrl
          sdkVersion
          iconUrl
          privacy
          icon {
            url
          }
        }
      }
    }
  }
`;

export function ExperienceContainer(props: ExperienceVars) {
  const username = props.username ? props.username.replace('@', '') : '';
  const query = useQuery<ExperienceData, ExperienceVars>(ExperiencePageQuery, {
    fetchPolicy: 'cache-and-network',
    variables: {
      username,
      slug: props.slug,
    },
  });

  const { error, data } = query;

  if (error) {
    console.log(error);
    return null;
  }

  // todo: use refetch and loading
  return <ExperienceView experience={data?.project?.project} />;
}
