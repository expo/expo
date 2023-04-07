import gql from 'graphql-tag';

export const AppFragmentNode = gql`
  fragment AppFragment on App {
    id
    scopeKey
    ownerAccount {
      id
    }
  }
`;
