import { ApolloClient, InMemoryCache } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { HttpLink } from '@apollo/client/link/http';

import Endpoints from '../constants/Endpoints';

let session = null;

const httpLink = new HttpLink({
  uri: `${Endpoints.api.origin}/--/graphql`,
});

const authMiddlewareLink = setContext((): any => {
  if (session?.sessionSecret) {
    return {
      headers: {
        'expo-session': session.sessionSecret,
      },
    };
  }
});

const link = authMiddlewareLink.concat(httpLink);

const cache = new InMemoryCache({
  possibleTypes: {
    ActivityTimelineProjectActivity: ['Build', 'BuildJob'],
    BuildOrBuildJob: ['Build', 'BuildJob'],
    BaseSearchResult: ['UserSearchResult', 'AppSearchResult'],
    Project: ['App', 'Snack'],
  },
  addTypename: true,
  typePolicies: {
    Query: {
      fields: {
        account: {
          merge: false,
        },
        app: {
          merge: false,
        },
      },
    },
  },
});

export function setApolloSession(newSession) {
  session = newSession;
}

export default new ApolloClient({
  link,
  cache,
});
