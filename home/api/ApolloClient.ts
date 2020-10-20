import ApolloClient from 'apollo-boost';
import { InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-cache-inmemory';

import Store from '../redux/Store';
import Config from './Config';
import Connectivity from './Connectivity';
import graphqlFragmentTypes from './generated/graphqlFragmentTypes.json';

export default new ApolloClient({
  uri: `${Config.api.origin}/--/graphql`,

  async request(operation): Promise<void> {
    const isConnected = await Connectivity.isAvailableAsync();
    if (!isConnected) {
      throw new Error('No connection available');
    }

    const { sessionSecret } = Store.getState().session;
    if (sessionSecret) {
      operation.setContext({
        headers: { 'expo-session': sessionSecret },
      });
    }
  },

  cache: new InMemoryCache({
    fragmentMatcher: new IntrospectionFragmentMatcher({
      introspectionQueryResultData: graphqlFragmentTypes,
    }),
    dataIdFromObject(value) {
      // Make sure to return null if this object doesn't have an ID
      return value.hasOwnProperty('id') ? value.id : null;
    },
  }),
});
