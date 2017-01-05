/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule ExStore
 */
'use strict';

import BrowserActions from 'BrowserActions';
import BrowserReducer from 'BrowserReducer';
import ConsoleReducer from 'ConsoleReducer';
import ExButtonReducer from 'ExButtonReducer';
import Flux from 'Flux';

let reducers = {
  browser: BrowserReducer,
  console: ConsoleReducer,
  exponentButton: ExButtonReducer,
};

let store = Flux.createStore(reducers);

store.dispatch(BrowserActions.loadHistoryAsync());

export default store;
