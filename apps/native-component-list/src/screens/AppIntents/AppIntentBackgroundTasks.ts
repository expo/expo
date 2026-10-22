import type { AppIntentInvocation } from 'expo-app-intents';
import * as TaskManager from 'expo-task-manager';

import { recordBackgroundCounterInvocation } from './AppIntentsStore';

/** Run by `IncreaseCounterInBackgroundIntent` in Swift, which waits for the message it returns. */
export const increaseCounterInBackgroundTaskName = 'app-intents-increase-counter-in-background';

// Defined at module scope, because an intent that does not open the app launches it in the
// background, where no component is mounted. `AppIntentsNavigationHandler` imports this module, and
// both example apps import that handler at startup.
TaskManager.defineTask<AppIntentInvocation>(
  increaseCounterInBackgroundTaskName,
  async ({ data: invocation }) => {
    const { count } = await recordBackgroundCounterInvocation(invocation);
    return `The counter is now ${count}.`;
  }
);

/** Run by `GetCurrentTimeIntent` in Swift, which reads `time` and `dayOfWeek` from the result. */
export const fetchCurrentTimeTaskName = 'app-intents-fetch-current-time';

type TimeApiResponse = {
  time: string;
  dayOfWeek: string;
};

// Shows a task that waits for the network while the intent waits for the task. The intent's timeout
// covers the whole request, so keep requests like this short.
TaskManager.defineTask<AppIntentInvocation>(
  fetchCurrentTimeTaskName,
  async ({ data: invocation }) => {
    const { timeZone } = invocation.params;
    const zone = typeof timeZone === 'string' && timeZone.length > 0 ? timeZone : 'UTC';
    try {
      const response = await fetch(
        `https://timeapi.io/api/time/current/zone?timeZone=${encodeURIComponent(zone)}`
      );
      if (!response.ok) {
        throw new Error(
          `timeapi.io could not tell the time in "${zone}" (HTTP ${response.status}: ${await response.text()}). Use an IANA time zone name such as "Europe/Warsaw".`
        );
      }
      const { time, dayOfWeek } = (await response.json()) as TimeApiResponse;
      return { time, dayOfWeek, timeZone: zone };
    } catch (error) {
      // Covers a failed request, an error status, and a body that is not JSON. The error is thrown
      // again, so it still reaches Swift, which shows its message in Siri or Shortcuts.
      console.error(
        `The "${fetchCurrentTimeTaskName}" task could not fetch the current time in "${zone}" (invocation ${invocation.id}).`,
        error
      );
      throw error;
    }
  }
);
