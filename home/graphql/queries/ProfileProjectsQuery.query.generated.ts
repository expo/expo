import * as Types from '../types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions =  {}
export type Home_MyAppsQueryVariables = Types.Exact<{
  limit: Types.Scalars['Int'];
  offset: Types.Scalars['Int'];
}>;


export type Home_MyAppsQuery = { __typename?: 'RootQuery', me?: Types.Maybe<{ __typename?: 'User', id: string, appCount: number, apps: Array<{ __typename?: 'App', id: string, description: string, fullName: string, iconUrl?: Types.Maybe<string>, lastPublishedTime: any, name: string, username: string, packageName: string, privacy: string, sdkVersion: string, published: boolean }> }> };


export const Home_MyAppsDocument = gql`
    query Home_MyApps($limit: Int!, $offset: Int!) {
  me {
    id
    appCount
    apps(limit: $limit, offset: $offset) {
      id
      description
      fullName
      iconUrl
      lastPublishedTime
      name
      username
      packageName
      privacy
      sdkVersion
      published
    }
  }
}
    `;
export function useHome_MyAppsQuery(baseOptions: Apollo.QueryHookOptions<Home_MyAppsQuery, Home_MyAppsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<Home_MyAppsQuery, Home_MyAppsQueryVariables>(Home_MyAppsDocument, options);
      }
export function useHome_MyAppsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<Home_MyAppsQuery, Home_MyAppsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<Home_MyAppsQuery, Home_MyAppsQueryVariables>(Home_MyAppsDocument, options);
        }
export type Home_MyAppsQueryHookResult = ReturnType<typeof useHome_MyAppsQuery>;
export type Home_MyAppsLazyQueryHookResult = ReturnType<typeof useHome_MyAppsLazyQuery>;
export type Home_MyAppsQueryResult = Apollo.QueryResult<Home_MyAppsQuery, Home_MyAppsQueryVariables>;
export function refetchHome_MyAppsQuery(variables?: Home_MyAppsQueryVariables) {
      return { query: Home_MyAppsDocument, variables: variables }
    }