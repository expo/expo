/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 */

import { applyMiddleware, combineReducers, createStore } from 'redux';
import thunk from 'redux-thunk';

import ProfileReducer from './ProfileReducer';
import HistoryReducer from './HistoryReducer';
import SessionReducer from './SessionReducer';
import SettingsReducer from './SettingsReducer';

const reduce = combineReducers({
  profile: ProfileReducer,
  history: HistoryReducer,
  session: SessionReducer,
  settings: SettingsReducer,
});

export default createStore(reduce, applyMiddleware(thunk));
