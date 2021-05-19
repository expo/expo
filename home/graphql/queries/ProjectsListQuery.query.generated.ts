import * as Types from '../types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions =  {}
export type Home_AccountAppsQueryVariables = Types.Exact<{
  accountName: Types.Scalars['String'];
  limit: Types.Scalars['Int'];
  offset: Types.Scalars['Int'];
}>;


export type Home_AccountAppsQuery = { __typename?: 'RootQuery', account: { __typename?: 'AccountQuery', byName: { __typename?: 'Account', id: string, appCount: number, apps: Array<{ __typename?: 'App', id: string, fullName: string, name: string, iconUrl?: Types.Maybe<string>, packageName: string, username: string, description: string, lastPublishedTime: any, sdkVersion: string, published: boolean, privacy: string }> } } };


export const Home_AccountAppsDocument = gql`
    query Home_AccountApps($accountName: String!, $limit: Int!, $offset: Int!) {
  account {
    byName(accountName: $accountName) {
      id
      appCount
      apps(limit: $limit, offset: $offset) {
        id
        fullName
        name
        iconUrl
        packageName
        username
        description
        lastPublishedTime
        sdkVersion
        published
        privacy
      }
    }
  }
}
    `;
export function useHome_AccountAppsQuery(baseOptions: Apollo.QueryHookOptions<Home_AccountAppsQuery, Home_AccountAppsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<Home_AccountAppsQuery, Home_AccountAppsQueryVariables>(Home_AccountAppsDocument, options);
      }
export function useHome_AccountAppsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<Home_AccountAppsQuery, Home_AccountAppsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<Home_AccountAppsQuery, Home_AccountAppsQueryVariables>(Home_AccountAppsDocument, options);
        }
export type Home_AccountAppsQueryHookResult = ReturnType<typeof useHome_AccountAppsQuery>;
export type Home_AccountAppsLazyQueryHookResult = ReturnType<typeof useHome_AccountAppsLazyQuery>;
export type Home_AccountAppsQueryResult = Apollo.QueryResult<Home_AccountAppsQuery, Home_AccountAppsQueryVariables>;
export function refetchHome_AccountAppsQuery(variables?: Home_AccountAppsQueryVariables) {
      return { query: Home_AccountAppsDocument, variables: variables }
    }