/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule ExStore
 */

import AuthTokenReducer from 'AuthTokenReducer';
import BrowserReducer from 'BrowserReducer';
import ConsoleReducer from 'ConsoleReducer';
import ExButtonReducer from 'ExButtonReducer';
import SessionReducer from 'SessionReducer';
import Flux from 'Flux';
import ApolloClient from '../Api/ApolloClient';

let reducers = {
  authTokens: AuthTokenReducer,
  session: SessionReducer,
  browser: BrowserReducer,
  console: ConsoleReducer,
  exponentButton: ExButtonReducer,
  apollo: ApolloClient.reducer(),
};

let store = Flux.createStore(reducers);
export default store;
