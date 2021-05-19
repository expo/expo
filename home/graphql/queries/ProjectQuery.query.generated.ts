import * as Types from '../types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions =  {}
export type WebContainerProjectPage_QueryVariables = Types.Exact<{
  appId: Types.Scalars['String'];
  platform: Types.AppPlatform;
  runtimeVersions: Array<Types.Scalars['String']> | Types.Scalars['String'];
}>;


export type WebContainerProjectPage_Query = { __typename?: 'RootQuery', app?: Types.Maybe<{ __typename?: 'AppQuery', byId: { __typename?: 'App', id: string, name: string, slug: string, fullName: string, username: string, published: boolean, description: string, githubUrl?: Types.Maybe<string>, playStoreUrl?: Types.Maybe<string>, appStoreUrl?: Types.Maybe<string>, sdkVersion: string, iconUrl?: Types.Maybe<string>, privacy: string, icon?: Types.Maybe<{ __typename?: 'AppIcon', url: string }>, updateBranches: Array<{ __typename?: 'UpdateBranch', id: string, name: string, updates: Array<{ __typename?: 'Update', id: string, group: string, message?: Types.Maybe<string>, createdAt: any, runtimeVersion: string, platform: string, manifestPermalink: string }> }> } }> };


export const WebContainerProjectPage_QueryDocument = gql`
    query WebContainerProjectPage_Query($appId: String!, $platform: AppPlatform!, $runtimeVersions: [String!]!) {
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
          filter: {platform: $platform, runtimeVersions: $runtimeVersions}
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
export function useWebContainerProjectPage_Query(baseOptions: Apollo.QueryHookOptions<WebContainerProjectPage_Query, WebContainerProjectPage_QueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<WebContainerProjectPage_Query, WebContainerProjectPage_QueryVariables>(WebContainerProjectPage_QueryDocument, options);
      }
export function useWebContainerProjectPage_QueryLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<WebContainerProjectPage_Query, WebContainerProjectPage_QueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<WebContainerProjectPage_Query, WebContainerProjectPage_QueryVariables>(WebContainerProjectPage_QueryDocument, options);
        }
export type WebContainerProjectPage_QueryHookResult = ReturnType<typeof useWebContainerProjectPage_Query>;
export type WebContainerProjectPage_QueryLazyQueryHookResult = ReturnType<typeof useWebContainerProjectPage_QueryLazyQuery>;
export type WebContainerProjectPage_QueryQueryResult = Apollo.QueryResult<WebContainerProjectPage_Query, WebContainerProjectPage_QueryVariables>;
export function refetchWebContainerProjectPage_Query(variables?: WebContainerProjectPage_QueryVariables) {
      return { query: WebContainerProjectPage_QueryDocument, variables: variables }
    }