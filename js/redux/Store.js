/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 */

import {
  applyMiddleware,
  combineReducers,
  createStore,
} from 'redux';
import thunk from 'redux-thunk';

import ApolloClient from '../api/ApolloClient';
import AuthTokenReducer from './AuthTokenReducer';
import HistoryReducer from './HistoryReducer';
import SessionReducer from './SessionReducer';
import SettingsReducer from './SettingsReducer';
// import ExButtonReducer from 'ExButtonReducer';

const reduce = combineReducers({
  authTokens: AuthTokenReducer,
  history: HistoryReducer,
  session: SessionReducer,
  settings: SettingsReducer,
  // exponentButton: ExButtonReducer,
  apollo: ApolloClient.reducer(),
});

export default createStore(reduce, applyMiddleware(thunk));
