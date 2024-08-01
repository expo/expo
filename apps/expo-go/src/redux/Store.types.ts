import { Action } from 'redux';
import { ThunkAction } from 'redux-thunk';

import { HistoryType } from './HistoryReducer';
import { SessionType } from './SessionReducer';
import { SettingsType } from './SettingsReducer';
import Store from './Store';

export interface RootState {
  history: HistoryType;
  session: SessionType;
  settings: SettingsType;
}

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export type AppDispatch = typeof Store.dispatch;
