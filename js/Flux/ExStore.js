/**
 * @providesModule ExStore
 */
'use strict';

import {
  AsyncStorage,
} from 'react-native';

import AccountActions from 'AccountActions';
import AccountReducer from 'AccountReducer';
import BrowserActions from 'BrowserActions';
import BrowserReducer from 'BrowserReducer';
import ConsoleReducer from 'ConsoleReducer';
import ExButtonReducer from 'ExButtonReducer';
import Flux from 'Flux';
import StorageKeys from 'StorageKeys';

let reducers = {
  account: AccountReducer,
  browser: BrowserReducer,
  console: ConsoleReducer,
  exponentButton: ExButtonReducer,
};

let store = Flux.createStore(reducers);

store.dispatch(BrowserActions.loadHistoryAsync());

// Populate the stores with data from disk. Currently this is super simple since
// we have only one item to read. Later this initialization may get more complex
store.initialization = AsyncStorage.multiGet([StorageKeys.Email, StorageKeys.SkipRegistration]).
  then(([[,email], [,skipRegistration]]) => {
  store.dispatch(AccountActions.setAccount(email, skipRegistration));
}, error => {
  console.error(error.stack);
});

export default store;
