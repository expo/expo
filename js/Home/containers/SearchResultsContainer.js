import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { groupBy } from 'lodash';

import SearchResults from '../components/SearchResults';

const SearchQuery = gql`
  query Search($offset: Int!, $limit: Int!, $query: String!) {
    searchUsersAndApps(type: ALL, query: $query, offset: $offset, limit: $limit) {
      __typename
      ... on BaseSearchResult {
        id
        rank
      }
      ... on AppSearchResult {
        app {
          id
          fullName
          name
          description
          packageUsername
          iconUrl
          likeCount
          isLikedByMe
        }
      }
      ... on UserSearchResult {
        user {
          id
          fullName
          username
          appCount
          profilePhoto
          isLegacy
        }
      }
    }
  }
`;

export default graphql(SearchQuery, {
  props: props => {
    let { data } = props;

    let results = groupBy(data.searchUsersAndApps, result => result.__typename);

    return {
      ...props,
      data: {
        ...data,
        results,
      },
    };
  },
  options: props => ({
    variables: {
      offset: 0,
      limit: props.query.length < 2 ? 0 : 10,
      query: props.query,
    },
    returnPartialData: true,
    forceFetch: true,
  }),
})(SearchResults);
