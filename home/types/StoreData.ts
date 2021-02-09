import { HistoryList } from './HistoryList';
import { Settings } from './Settings';

export type StoreData = {
  history: {
    history: HistoryList;
  };
  session?: {
    sessionSecret?: string;
  };
  settings: Settings;
};
