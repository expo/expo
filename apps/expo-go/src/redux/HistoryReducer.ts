import { List, Record } from 'immutable';

import { HistoryItem as HistoryItemInput } from '../types';

type HistoryItemObject = {
  url: null | string;
  bundleUrl: null | string;
  manifestUrl: null | string;
  manifest: null | { [key: string]: any };
  time: null | number;
};

type HistoryItemType = Record<HistoryItemObject> & Readonly<HistoryItemObject>;

const HistoryItem = Record<HistoryItemObject>({
  url: null,
  bundleUrl: null,
  manifestUrl: null,
  manifest: null,
  time: null,
});

type HistoryObject = {
  history: List<HistoryItemType>;
};

export type HistoryType = Record<HistoryObject> & Readonly<HistoryObject>;

const HistoryState = Record<HistoryObject>({
  history: List(),
});

type HistoryActions =
  | {
      type: 'loadHistory';
      payload: { history: HistoryItemInput[] };
    }
  | { type: 'clearHistory' };

export default (state: HistoryType, action: HistoryActions): HistoryType => {
  switch (action.type) {
    case 'loadHistory': {
      const { history } = action.payload;
      const immutableHistoryList = history
        ? List(history.map((item) => new HistoryItem(item)))
        : List();
      return state.merge({
        // @ts-ignore
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
