import type { NavigationState, RouterActionHandling, RouterActionResult } from '../../types';
import { isActionHandled } from '../../utils';

// Returns the result of an action the test expects the router to handle.
export function expectHandled<Result extends RouterActionResult<NavigationState>>(
  result: Result | RouterActionHandling.Unhandled | null
): Result {
  if (!isActionHandled(result)) {
    throw new Error('Expected the router to handle the action, but it left the action unhandled.');
  }
  return result;
}
