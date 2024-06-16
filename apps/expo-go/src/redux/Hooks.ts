import {
  TypedUseSelectorHook,
  useDispatch as useUntypedDispatch,
  useSelector as useUntypedSelector,
} from 'react-redux';
import { AnyAction } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

import { RootState } from './Store.types';

export const useSelector: TypedUseSelectorHook<RootState> = useUntypedSelector;

export const useDispatch = (): ThunkDispatch<RootState, any, AnyAction> => useUntypedDispatch();
