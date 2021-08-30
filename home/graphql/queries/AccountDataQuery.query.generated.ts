import * as Types from '../types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions =  {}
export type Home_AccountDataQueryVariables = Types.Exact<{
  accountName: Types.Scalars['String'];
  appLimit: Types.Scalars['Int'];
  snackLimit: Types.Scalars['Int'];
}>;


export type Home_AccountDataQuery = { __typename?: 'RootQuery', account: { __typename?: 'AccountQuery', byName: { __typename?: 'Account', id: string, name: string, appCount: number, apps: Array<{ __typename?: 'App', id: string, fullName: string, name: string, iconUrl?: Types.Maybe<string>, packageName: string, username: string, description: string, sdkVersion: string, published: boolean, lastPublishedTime: any, privacy: string }>, snacks: Array<{ __typename?: 'Snack', id: string, name: string, description: string, fullName: string, slug: string, isDraft: boolean }> } } };


export const Home_AccountDataDocument = gql`
    query Home_AccountData($accountName: String!, $appLimit: Int!, $snackLimit: Int!) {
  account {
    byName(accountName: $accountName) {
      id
      name
      appCount
      apps(limit: $appLimit, offset: 0) {
        id
        fullName
        name
        iconUrl
        packageName
        username
        description
        sdkVersion
        published
        lastPublishedTime
        privacy
      }
      snacks(limit: $snackLimit, offset: 0) {
        id
        name
        description
        fullName
        slug
        isDraft
      }
    }
  }
}
    `;
export function useHome_AccountDataQuery(baseOptions: Apollo.QueryHookOptions<Home_AccountDataQuery, Home_AccountDataQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<Home_AccountDataQuery, Home_AccountDataQueryVariables>(Home_AccountDataDocument, options);
      }
export function useHome_AccountDataLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<Home_AccountDataQuery, Home_AccountDataQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<Home_AccountDataQuery, Home_AccountDataQueryVariables>(Home_AccountDataDocument, options);
        }
export type Home_AccountDataQueryHookResult = ReturnType<typeof useHome_AccountDataQuery>;
export type Home_AccountDataLazyQueryHookResult = ReturnType<typeof useHome_AccountDataLazyQuery>;
export type Home_AccountDataQueryResult = Apollo.QueryResult<Home_AccountDataQuery, Home_AccountDataQueryVariables>;
export function refetchHome_AccountDataQuery(variables?: Home_AccountDataQueryVariables) {
      return { query: Home_AccountDataDocument, variables: variables }
    }