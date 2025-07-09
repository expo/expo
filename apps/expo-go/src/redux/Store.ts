/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 */

import { applyMiddleware, combineReducers, createStore } from 'redux';
import thunk from 'redux-thunk';

import HistoryReducer from './HistoryReducer';
import SessionReducer from './SessionReducer';
import SettingsReducer from './SettingsReducer';

const reduce = combineReducers({
  history: HistoryReducer,
  session: SessionReducer,
  settings: SettingsReducer,
});

export default createStore(reduce, applyMiddleware(thunk));
