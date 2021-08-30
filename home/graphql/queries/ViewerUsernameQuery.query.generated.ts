import * as Types from '../types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions =  {}
export type Home_ViewerUsernameQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type Home_ViewerUsernameQuery = { __typename?: 'RootQuery', me?: Types.Maybe<{ __typename?: 'User', id: string, username: string }> };


export const Home_ViewerUsernameDocument = gql`
    query Home_ViewerUsername {
  me {
    id
    username
  }
}
    `;
export function useHome_ViewerUsernameQuery(baseOptions?: Apollo.QueryHookOptions<Home_ViewerUsernameQuery, Home_ViewerUsernameQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<Home_ViewerUsernameQuery, Home_ViewerUsernameQueryVariables>(Home_ViewerUsernameDocument, options);
      }
export function useHome_ViewerUsernameLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<Home_ViewerUsernameQuery, Home_ViewerUsernameQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<Home_ViewerUsernameQuery, Home_ViewerUsernameQueryVariables>(Home_ViewerUsernameDocument, options);
        }
export type Home_ViewerUsernameQueryHookResult = ReturnType<typeof useHome_ViewerUsernameQuery>;
export type Home_ViewerUsernameLazyQueryHookResult = ReturnType<typeof useHome_ViewerUsernameLazyQuery>;
export type Home_ViewerUsernameQueryResult = Apollo.QueryResult<Home_ViewerUsernameQuery, Home_ViewerUsernameQueryVariables>;
export function refetchHome_ViewerUsernameQuery(variables?: Home_ViewerUsernameQueryVariables) {
      return { query: Home_ViewerUsernameDocument, variables: variables }
    }