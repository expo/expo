import { List, OrderedMap, Record } from 'immutable';

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

export default (state, action) => {
  switch (action.type) {
    case 'clearConsole':
      return new ConsoleState();
    case 'logUncaughtError':
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
    default:
      return state || new ConsoleState();
  }
};
