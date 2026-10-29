import { StackRouter } from '../layouts/StackClient';
import {
  type CommonNavigationAction,
  extendRouterActions,
  RouterActionHandling,
  type StackActionType,
} from '../react-navigation/native';
import { isActionHandled } from '../react-navigation/routers/utils';

let didWarnPush = false;

/**
 * Keeps only the focused route and the preloaded routes, like tabs with `backBehavior: 'none'`. Back actions go to the
 * parent navigator.
 */
export const SplitViewContentRouter = extendRouterActions(
  StackRouter,
  (state, action: StackActionType | CommonNavigationAction, { baseRouter }) => {
    if (action.type === 'GO_BACK' || action.type === 'POP' || action.type === 'POP_TO_TOP') {
      return RouterActionHandling.Unhandled;
    }
    const result = baseRouter.getStateForAction(state, action);
    if (!isActionHandled(result)) {
      return result;
    }
    if (action.type === 'PUSH' && process.env.NODE_ENV !== 'production' && !didWarnPush) {
      didWarnPush = true;
      // TODO(@ubax): move console side effects out of the reducer.
      console.warn(
        'router.push and Link with push replace the current route in a SplitView, because SplitView keeps only the current route on iOS. Use router.navigate, router.replace, or Link without push.'
      );
    }
    const { state: nextState } = result;
    if (nextState.index === 0) {
      return result;
    }
    // The stack keeps preloaded routes after the focused route.
    return {
      ...result,
      state: { ...nextState, index: 0, routes: nextState.routes.slice(nextState.index) },
    };
  }
);
