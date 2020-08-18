import { List, Record } from 'immutable';

type HistoryItemType = Record<{
  url: null | string;
  bundleUrl: null | string;
  manifestUrl: null | string;
  manifest: null | { [key: string]: any };
  time: null | number;
}>;

const HistoryItem = Record({
  url: null,
  bundleUrl: null,
  manifestUrl: null,
  manifest: null,
  time: null,
});

type HistoryObject = {
  history: List<HistoryItemType>;
};

export type HistoryType = Record<HistoryObject>;

const HistoryState = Record<HistoryObject>({
  history: List(),
});

type HistoryActions =
  | {
      type: 'loadHistory';
      payload: { history: HistoryItemType[] };
    }
  | { type: 'clearHistory' };

export default (state: HistoryType, action: HistoryActions): HistoryType => {
  switch (action.type) {
    case 'loadHistory': {
      const { history } = action.payload;
      const immutableHistoryList = history
        ? List(history.map(item => new HistoryItem(item)))
        : List();
      return state.merge({
        history: immutableHistoryList,
      });
    }
    case 'clearHistory':
      return state.merge({
        history: state.get('history').clear(),
      });
    default:
      return state ? state : new HistoryState();
  }
};
