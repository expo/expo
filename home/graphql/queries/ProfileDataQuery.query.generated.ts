import * as Types from '../types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions =  {}
export type Home_ProfileData2QueryVariables = Types.Exact<{
  appLimit: Types.Scalars['Int'];
  snackLimit: Types.Scalars['Int'];
}>;


export type Home_ProfileData2Query = { __typename?: 'RootQuery', me?: Types.Maybe<{ __typename?: 'User', id: string, username: string, firstName?: Types.Maybe<string>, lastName?: Types.Maybe<string>, profilePhoto: string, appCount: number, accounts: Array<{ __typename?: 'Account', id: string, name: string }>, apps: Array<{ __typename?: 'App', id: string, description: string, fullName: string, iconUrl?: Types.Maybe<string>, lastPublishedTime: any, name: string, packageName: string, username: string, sdkVersion: string, privacy: string, published: boolean }>, snacks: Array<{ __typename?: 'Snack', id: string, name: string, description: string, fullName: string, slug: string, isDraft: boolean }> }> };


export const Home_ProfileData2Document = gql`
    query Home_ProfileData2($appLimit: Int!, $snackLimit: Int!) {
  me {
    id
    username
    firstName
    lastName
    profilePhoto
    accounts {
      id
      name
    }
    appCount
    apps(limit: $appLimit, offset: 0) {
      id
      description
      fullName
      iconUrl
      lastPublishedTime
      name
      packageName
      username
      sdkVersion
      privacy
      published
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
    `;
export function useHome_ProfileData2Query(baseOptions: Apollo.QueryHookOptions<Home_ProfileData2Query, Home_ProfileData2QueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<Home_ProfileData2Query, Home_ProfileData2QueryVariables>(Home_ProfileData2Document, options);
      }
export function useHome_ProfileData2LazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<Home_ProfileData2Query, Home_ProfileData2QueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<Home_ProfileData2Query, Home_ProfileData2QueryVariables>(Home_ProfileData2Document, options);
        }
export type Home_ProfileData2QueryHookResult = ReturnType<typeof useHome_ProfileData2Query>;
export type Home_ProfileData2LazyQueryHookResult = ReturnType<typeof useHome_ProfileData2LazyQuery>;
export type Home_ProfileData2QueryResult = Apollo.QueryResult<Home_ProfileData2Query, Home_ProfileData2QueryVariables>;
export function refetchHome_ProfileData2Query(variables?: Home_ProfileData2QueryVariables) {
      return { query: Home_ProfileData2Document, variables: variables }
    }