import { ApolloClient, InMemoryCache } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { HttpLink } from '@apollo/client/link/http';
import { offsetLimitPagination } from '@apollo/client/utilities';

import Store from '../redux/Store';
import Config from './Config';
import Connectivity from './Connectivity';

const httpLink = new HttpLink({
  uri: `${Config.api.origin}/--/graphql`,
});

const connectivityLink = setContext(async (): Promise<any> => {
  const isConnected = await Connectivity.isAvailableAsync();
  if (!isConnected) {
    throw new Error('No connection available');
  }
});

const authMiddlewareLink = setContext((): any => {
  const { sessionSecret } = Store.getState().session;

  if (sessionSecret) {
    return {
      headers: { 'expo-session': sessionSecret },
    };
  }
});

const link = connectivityLink.concat(authMiddlewareLink.concat(httpLink));

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
    Account: {
      fields: {
        apps: offsetLimitPagination(),
        snacks: offsetLimitPagination(),
      },
    },
    App: {
      fields: {
        updateBranches: offsetLimitPagination(),
      },
    },
  },
});

export default new ApolloClient({
  link,
  cache,
});
