import { type NavigationState, RouterActionHandling, type RouterActionResult } from './types';

/**
 * Checks whether a router's `getStateForAction` handled the action. Use it instead of comparing
 * the result with `null`, because a router can leave an action unhandled with
 * `RouterActionHandling.Unhandled` or the deprecated `null`.
 *
 * @example
 * ```ts
 * const result = baseRouter.getStateForAction(state, action);
 * if (!isActionHandled(result)) {
 *   return result;
 * }
 * ```
 */
export function isActionHandled<State extends NavigationState>(
  result: RouterActionResult<State> | RouterActionHandling.Unhandled | null
): result is RouterActionResult<State> {
  return result !== null && result !== RouterActionHandling.Unhandled;
}
