import { gql } from '@urql/core';

export const AppFragmentNode = gql`
  fragment AppFragment on App {
    id
    scopeKey
    ownerAccount {
      id
    }
  }
`;
