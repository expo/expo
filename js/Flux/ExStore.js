/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule ExStore
 */
'use strict';

import AuthTokenReducer from 'AuthTokenReducer';
import BrowserActions from 'BrowserActions';
import BrowserReducer from 'BrowserReducer';
import ConsoleReducer from 'ConsoleReducer';
import ExButtonReducer from 'ExButtonReducer';
import Flux from 'Flux';
import ApolloClient from '../Api/ApolloClient';

let reducers = {
  authTokens: AuthTokenReducer,
  browser: BrowserReducer,
  console: ConsoleReducer,
  exponentButton: ExButtonReducer,
  apollo: ApolloClient.reducer(),
};

let store = Flux.createStore(reducers);

export default store;
