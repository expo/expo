import * as Types from '../types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions =  {}
export type Home_ProfileSnacksQueryVariables = Types.Exact<{
  limit: Types.Scalars['Int'];
  offset: Types.Scalars['Int'];
}>;


export type Home_ProfileSnacksQuery = { __typename?: 'RootQuery', me?: Types.Maybe<{ __typename?: 'User', id: string, snacks: Array<{ __typename?: 'Snack', id: string, name: string, description: string, fullName: string, slug: string, isDraft: boolean }> }> };


export const Home_ProfileSnacksDocument = gql`
    query Home_ProfileSnacks($limit: Int!, $offset: Int!) {
  me {
    id
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
    `;
export function useHome_ProfileSnacksQuery(baseOptions: Apollo.QueryHookOptions<Home_ProfileSnacksQuery, Home_ProfileSnacksQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<Home_ProfileSnacksQuery, Home_ProfileSnacksQueryVariables>(Home_ProfileSnacksDocument, options);
      }
export function useHome_ProfileSnacksLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<Home_ProfileSnacksQuery, Home_ProfileSnacksQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<Home_ProfileSnacksQuery, Home_ProfileSnacksQueryVariables>(Home_ProfileSnacksDocument, options);
        }
export type Home_ProfileSnacksQueryHookResult = ReturnType<typeof useHome_ProfileSnacksQuery>;
export type Home_ProfileSnacksLazyQueryHookResult = ReturnType<typeof useHome_ProfileSnacksLazyQuery>;
export type Home_ProfileSnacksQueryResult = Apollo.QueryResult<Home_ProfileSnacksQuery, Home_ProfileSnacksQueryVariables>;
export function refetchHome_ProfileSnacksQuery(variables?: Home_ProfileSnacksQueryVariables) {
      return { query: Home_ProfileSnacksDocument, variables: variables }
    }