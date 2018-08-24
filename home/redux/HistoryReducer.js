import HistoryActions from './HistoryActions';
import { List, Record } from 'immutable';

const HistoryState = Record({
  history: List(),
});

const HistoryItem = Record({
  url: null,
  bundleUrl: null,
  manifestUrl: null,
  manifest: null,
  time: null,
});

export default (state, action) => {
  switch (action.type) {
  case 'loadHistory':
    const { history } = action.payload;
    const immutableHistoryList = (history)
          ? new List(history.map(item => new HistoryItem(item)))
          : List();
    return state.merge({
      history: immutableHistoryList,
    });
  case 'clearHistory':
    return state.merge({
      history: state.history.clear(),
    });
  default:
    return (state ) ? state : new HistoryState();
  }
};
