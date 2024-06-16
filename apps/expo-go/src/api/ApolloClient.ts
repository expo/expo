import { ApolloClient, InMemoryCache, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { HttpLink } from '@apollo/client/link/http';
import { offsetLimitPagination } from '@apollo/client/utilities';

import Config from './Config';
import Connectivity from './Connectivity';
import Store from '../redux/Store';

const httpLink = new HttpLink({
  uri: `${Config.api.origin}/--/graphql`,
});

const connectivityLink = setContext(async (): Promise<any> => {
  const isConnected = await Connectivity.isAvailableAsync();
  if (!isConnected) {
    throw new Error('No connection available');
  }
});

const authMiddlewareLink = setContext((_request, previousContext): any => {
  const { sessionSecret } = Store.getState().session;

  if (sessionSecret) {
    return {
      ...previousContext,
      headers: {
        'expo-session': sessionSecret,
        ...previousContext.headers,
      },
    };
  }

  return previousContext;
});

const link = from([connectivityLink, authMiddlewareLink, httpLink]);

const cache = new InMemoryCache({
  possibleTypes: {
    AccountUsageMetadata: ['AccountUsageEASBuildMetadata'],
    ActivityTimelineProjectActivity: ['Build', 'BuildJob', 'Submission', 'Update'],
    Actor: ['Robot', 'SSOUser', 'User'],
    BuildOrBuildJob: ['Build', 'BuildJob'],
    EASBuildOrClassicBuildJob: ['Build', 'BuildJob'],
    FcmSnippet: ['FcmSnippetLegacy', 'FcmSnippetV1'],
    PlanEnablement: ['Concurrencies', 'EASTotalPlanEnablement'],
    Project: ['App', 'Snack'],
    UserActor: ['SSOUser', 'User'],
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
