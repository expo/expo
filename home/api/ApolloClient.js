/* @flow */

import ApolloClient from 'apollo-boost';
import { InMemoryCache } from 'apollo-cache-inmemory';

import Connectivity from './Connectivity';
import Store from '../redux/Store';

export default new ApolloClient({
  uri: 'https://exp.host/--/graphql',

  async request(operation) {
    let isConnected = await Connectivity.isAvailableAsync();
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
    dataIdFromObject(value) {
      // Make sure to return null if this object doesn't have an ID
      return value.hasOwnProperty('id') ? value.id : null;
    },
  }),
});
