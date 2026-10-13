import { type NavigationState, RouterActionHandling, type RouterActionResult } from './types';

/**
 * Checks whether a router's `getStateForAction` rejected the action. Use it instead of comparing
 * the result with `null`, because a router can reject an action with `RouterActionHandling.Reject`
 * or the deprecated `null`.
 *
 * @example
 * ```ts
 * const result = baseRouter.getStateForAction(state, action);
 * if (isActionRejected(result)) {
 *   return result;
 * }
 * ```
 */
export function isActionRejected<State extends NavigationState>(
  result: RouterActionResult<State> | RouterActionHandling.Reject | null
): result is RouterActionHandling.Reject | null {
  return result === null || result === RouterActionHandling.Reject;
}
