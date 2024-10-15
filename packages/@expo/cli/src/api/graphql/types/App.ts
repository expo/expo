import { TypedDocumentNode, gql } from '@urql/core';

export const AppFragmentNode: TypedDocumentNode = gql`
  fragment AppFragment on App {
    id
    scopeKey
    ownerAccount {
      id
    }
  }
`;
