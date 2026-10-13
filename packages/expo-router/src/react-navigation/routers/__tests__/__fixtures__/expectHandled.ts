import type { NavigationState, RouterActionHandling, RouterActionResult } from '../../types';
import { isActionRejected } from '../../utils';

// Returns the result of an action the test expects the router to handle.
export function expectHandled<Result extends RouterActionResult<NavigationState>>(
  result: Result | RouterActionHandling.Reject | null
): Result {
  if (isActionRejected(result)) {
    throw new Error('Expected the router to handle the action, but it rejected it.');
  }
  return result;
}
