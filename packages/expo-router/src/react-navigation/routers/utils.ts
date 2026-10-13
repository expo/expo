import { type NavigationState, RouterActionHandling, type RouterActionResult } from './types';

// Internal: `Router` results use both `null` (deprecated) and `Reject` for a rejected action.
export function isActionRejected<State extends NavigationState>(
  result: RouterActionResult<State> | RouterActionHandling.Reject | null
): result is RouterActionHandling.Reject | null {
  return result === null || result === RouterActionHandling.Reject;
}
