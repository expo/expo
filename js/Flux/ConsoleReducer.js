/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule ConsoleReducer
 */
'use strict';

import ConsoleActions from 'ConsoleActions';
import Flux from 'Flux';
import { List, OrderedMap, Record } from 'immutable';

const ConsoleActionTypes = Flux.getActionTypes(ConsoleActions);

const ConsoleState = Record({
  history: OrderedMap(),
});

const ConsoleEntry = Record({
  type: null,
  time: null,
  message: null,
  stack: null,
  fatal: false,
});

export default Flux.createReducer(new ConsoleState(), {
  [ConsoleActionTypes.clearConsole](state, action) {
    return new ConsoleState();
  },

  [ConsoleActionTypes.logUncaughtError](state, action) {
    let { payload } = action;
    let oldEntry = state.history.get(payload.id);
    let time = oldEntry ? oldEntry.time : payload.time;
    let fatal = payload.fatal;
    if (fatal == null && oldEntry) {
      fatal = oldEntry.fatal;
    }
    let entry = new ConsoleEntry({
      type: 'uncaughtError',
      time,
      message: payload.message,
      stack: List(payload.stack),
      fatal: payload.fatal,
    });
    return state.setIn(['history', payload.id], entry);
  },

  [ConsoleActionTypes.logError](state, action) {
    return log('error', state, action);
  },

  [ConsoleActionTypes.logWarning](state, action) {
    return log('warning', state, action);
  },

  [ConsoleActionTypes.logInfo](state, action) {
    return log('info', state, action);
  },
});

function log(level, state, action) {
  let { payload } = action;
  let entry = new ConsoleEntry({
    type: level,
    time: payload.time,
    message: payload.message,
    stack: payload.stack ? List(payload.stack) : null,
  });
  return state.setIn(['history', payload.id], entry);
}
