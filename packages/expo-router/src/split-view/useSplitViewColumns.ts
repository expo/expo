import { useCallback, useLayoutEffect, useMemo, useReducer, type ActionDispatch } from 'react';

import { internalNavigationEvents } from '../global-state/internalNavigationEvents';
import type { SplitViewColumnName } from '../global-state/types';
import type { SplitHostCommands } from '../optional-libraries/react-native-screens';
import type { SplitViewState } from './useSplitView';

type ColumnState = {
  // Passed to native as `topColumnForCollapsing`.
  column: SplitViewColumnName | undefined;
  isCollapsed: boolean;
  visible: readonly SplitViewColumnName[];
  // Columns that started to appear or disappear and did not finish.
  transitioning: readonly SplitViewColumnName[];
  // A request that waits until the column transition finishes.
  pending: SplitViewColumnName | undefined;
  // A new object for each native `show()` call, so the same column can be shown again.
  showRequest: { column: SplitViewColumnName } | undefined;
};

type ColumnAction =
  | { type: 'request'; column: SplitViewColumnName }
  | { type: 'collapse' | 'expand' | 'shown' }
  | { type: 'transition-start' | 'appear' | 'disappear'; column: SplitViewColumnName };

function reduceColumns(state: ColumnState, action: ColumnAction): ColumnState {
  switch (action.type) {
    case 'request':
      if (!state.isCollapsed) {
        return { ...state, column: action.column, pending: undefined };
      }
      if (state.transitioning.length > 0) {
        return { ...state, column: action.column, pending: action.column };
      }
      return { ...state, column: action.column, showRequest: { column: action.column } };
    case 'collapse':
      return { ...state, isCollapsed: true };
    case 'expand':
      return { ...state, isCollapsed: false, pending: undefined };
    case 'shown':
      return { ...state, showRequest: undefined };
    case 'transition-start':
      return {
        ...state,
        transitioning: [...without(state.transitioning, action.column), action.column],
      };
    case 'appear':
      return settle({
        ...state,
        visible: [...without(state.visible, action.column), action.column],
        transitioning: without(state.transitioning, action.column),
      });
    case 'disappear':
      return settle({
        ...state,
        visible: without(state.visible, action.column),
        transitioning: without(state.transitioning, action.column),
      });
  }
}

// The compact column follows native only while the layout is collapsed and exactly one column is visible. This skips
// the expand transition, where a column appears before `onExpand`, and a full-screen modal, which hides all columns.
function settle(state: ColumnState): ColumnState {
  if (!state.isCollapsed || state.transitioning.length > 0 || state.visible.length !== 1) {
    return state;
  }
  const visibleColumn = state.visible[0]!;
  if (state.pending && state.pending !== visibleColumn) {
    return { ...state, pending: undefined, showRequest: { column: state.pending } };
  }
  return { ...state, column: visibleColumn, pending: undefined };
}

function without(columns: readonly SplitViewColumnName[], column: SplitViewColumnName) {
  return columns.filter((name) => name !== column);
}

export function useSplitViewColumns(
  columnNames: readonly SplitViewColumnName[],
  initialColumn: SplitViewColumnName | undefined,
  host: SplitHostCommands | null
) {
  const [state, dispatch] = useReducer(reduceColumns, {
    column: initialColumn,
    isCollapsed: false,
    visible: [],
    transitioning: [],
    pending: undefined,
    showRequest: undefined,
  });

  const show = useCallback(
    (requested: string) => {
      const column = columnNames.find((name) => name === requested);
      if (column) {
        dispatch({ type: 'request', column });
      } else if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `SplitView cannot show the "${requested}" column, because it has only these columns: ${columnNames.map((name) => `"${name}"`).join(', ')}. Request one of these columns, or add a SplitView.Column.`
        );
      }
    },
    [columnNames]
  );

  // A layout effect subscribes before the navigation container emits the request of the navigation that mounts the
  // SplitView, because child layout effects run first.
  useLayoutEffect(
    () =>
      internalNavigationEvents.addListener('splitViewColumnRequested', (event) =>
        show(event.column)
      ),
    [show]
  );

  const { showRequest } = state;
  useLayoutEffect(() => {
    if (showRequest && host) {
      host.show(showRequest.column);
      dispatch({ type: 'shown' });
    }
  }, [showRequest, host]);

  const context = useMemo<SplitViewState>(
    () => ({ show, isCollapsed: state.isCollapsed, compactColumn: state.column }),
    [show, state.isCollapsed, state.column]
  );
  return { context, dispatch };
}

export function getColumnEventProps(
  dispatch: ActionDispatch<[ColumnAction]>,
  column: SplitViewColumnName
) {
  return {
    onWillAppear: () => dispatch({ type: 'transition-start', column }),
    onWillDisappear: () => dispatch({ type: 'transition-start', column }),
    onDidAppear: () => dispatch({ type: 'appear', column }),
    onDidDisappear: () => dispatch({ type: 'disappear', column }),
  };
}
