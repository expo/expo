/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 */

import { applyMiddleware, combineReducers, createStore } from 'redux';
import thunk from 'redux-thunk';

import ApolloClient from '../api/ApolloClient';
import ConsoleReducer from './ConsoleReducer';
import HistoryReducer from './HistoryReducer';
import SessionReducer from './SessionReducer';
import SettingsReducer from './SettingsReducer';

const reduce = combineReducers({
  console: ConsoleReducer,
  history: HistoryReducer,
  session: SessionReducer,
  settings: SettingsReducer,
  apollo: ApolloClient.reducer(),
});

export default createStore(reduce, applyMiddleware(thunk));
