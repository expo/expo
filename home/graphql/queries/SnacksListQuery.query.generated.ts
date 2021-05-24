import * as Types from '../types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions =  {}
export type Home_AccountSnacksQueryVariables = Types.Exact<{
  accountName: Types.Scalars['String'];
  limit: Types.Scalars['Int'];
  offset: Types.Scalars['Int'];
}>;


export type Home_AccountSnacksQuery = { __typename?: 'RootQuery', account: { __typename?: 'AccountQuery', byName: { __typename?: 'Account', id: string, name: string, snacks: Array<{ __typename?: 'Snack', id: string, name: string, description: string, fullName: string, slug: string, isDraft: boolean }> } } };


export const Home_AccountSnacksDocument = gql`
    query Home_AccountSnacks($accountName: String!, $limit: Int!, $offset: Int!) {
  account {
    byName(accountName: $accountName) {
      id
      name
      snacks(limit: $limit, offset: $offset) {
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
export function useHome_AccountSnacksQuery(baseOptions: Apollo.QueryHookOptions<Home_AccountSnacksQuery, Home_AccountSnacksQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<Home_AccountSnacksQuery, Home_AccountSnacksQueryVariables>(Home_AccountSnacksDocument, options);
      }
export function useHome_AccountSnacksLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<Home_AccountSnacksQuery, Home_AccountSnacksQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<Home_AccountSnacksQuery, Home_AccountSnacksQueryVariables>(Home_AccountSnacksDocument, options);
        }
export type Home_AccountSnacksQueryHookResult = ReturnType<typeof useHome_AccountSnacksQuery>;
export type Home_AccountSnacksLazyQueryHookResult = ReturnType<typeof useHome_AccountSnacksLazyQuery>;
export type Home_AccountSnacksQueryResult = Apollo.QueryResult<Home_AccountSnacksQuery, Home_AccountSnacksQueryVariables>;
export function refetchHome_AccountSnacksQuery(variables?: Home_AccountSnacksQueryVariables) {
      return { query: Home_AccountSnacksDocument, variables: variables }
    }