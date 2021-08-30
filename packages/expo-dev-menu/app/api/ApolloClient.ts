import ApolloClient from 'apollo-boost';
import { InMemoryCache } from 'apollo-cache-inmemory';

import Endpoints from '../constants/Endpoints';

let session = null;
const client = new ApolloClient({
  uri: `${Endpoints.api.origin}/--/graphql`,

  async request(operation): Promise<void> {
    // TODO(lukmccall): Check if the connection is available
    // const isConnected = await Connectivity.isAvailableAsync();
    // if (!isConnected) {
    //   throw new Error('No connection available');
    // }

    if (session?.sessionSecret) {
      operation.setContext({
        headers: {
          'expo-session': session.sessionSecret,
        },
      });
    }
  },

  cache: new InMemoryCache({
    dataIdFromObject(value) {
      // Make sure to return null if this object doesn't have an ID
      return value.hasOwnProperty('id') ? value.id : null;
    },
  }),
});

export function setApolloSession(newSession) {
  session = newSession;
}

export default client;
