/* @flow */

import { HTTPFetchNetworkInterface } from 'apollo-client';
import Connectivity from './Connectivity';

export default class ConnectivityAwareHTTPFetchNetworkInterface extends HTTPFetchNetworkInterface {
  async fetchFromRemoteEndpoint(options: any) {
    let isConnected = await Connectivity.isAvailableAsync();

    if (!isConnected) {
      throw new Error('No connection available');
    } else {
      return super.fetchFromRemoteEndpoint(options);
    }
  }
}
