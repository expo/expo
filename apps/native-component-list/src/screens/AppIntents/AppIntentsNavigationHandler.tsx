import * as AppIntents from 'expo-app-intents';
import { type ImperativeRouter, useRouter } from 'expo-router';
import * as React from 'react';

import {
  appIntentDishCatalog,
  type AppIntentRoute,
  processAppIntentInvocations,
} from './AppIntentsStore';
import { syncMailDraftCatalogAsync } from './syncMailDraftCatalogAsync';

export type AppIntentNavigationTarget = {
  route: AppIntentRoute;
  invocationId?: string;
  /** Set when the system asked to open a specific mail draft. */
  draftId?: string;
};

export function navigateToAppIntentScreen(
  router: Pick<ImperativeRouter, 'navigate'>,
  target: AppIntentNavigationTarget
): void {
  router.navigate({
    pathname: `/apis/app-intents/${target.route}`,
    params: {
      source: 'siri',
      ...(target.invocationId ? { intentId: target.invocationId } : {}),
      ...(target.draftId ? { draftId: target.draftId } : {}),
    },
  });
}

export function AppIntentsNavigationHandler() {
  const router = useRouter();

  React.useEffect(() => {
    if (!AppIntents.isAvailable()) {
      return;
    }

    // `setEntityCatalogAsync` asks the system to re-train the parameterized phrases after storing
    // the catalog, so no separate `refreshShortcutsAsync` call is needed. Calling it here would
    // also race the catalog write and could re-train against the previous catalog. Phrase refresh
    // is best-effort, so this promise only rejects when validating or storing the catalog fails.
    AppIntents.setEntityCatalogAsync('dish', appIntentDishCatalog).catch((error: unknown) => {
      console.warn(
        "Could not store the App Intents 'dish' entity catalog. Ordering a dish by voice may resolve against the previous catalog, or fail. The rest of the app is unaffected.",
        error
      );
    });

    syncMailDraftCatalogAsync().catch((error: unknown) => {
      console.warn('Could not seed App Intents mail draft catalogs.', error);
    });
  }, []);

  AppIntents.useAppIntents(async (pendingIntents, newIntent) => {
    if (newIntent) {
      console.log('[expo-app-intents invocation]', newIntent);
    }

    try {
      const result = await processAppIntentInvocations(pendingIntents, newIntent);

      // Settle every removal instead of short-circuiting on the first rejection, so one failed
      // dequeue cannot leave the other handled invocations in the queue.
      const removals = await Promise.allSettled(
        result.handledInvocationIds.map((id) => AppIntents.removePendingInvocationAsync(id))
      );
      removals.forEach((removal, index) => {
        if (removal.status === 'rejected') {
          console.warn(
            `Could not remove the handled App Intent invocation ${result.handledInvocationIds[index]} from the pending queue. It stays pending and is delivered again on the next launch.`,
            removal.reason
          );
        }
      });

      // Creating or deleting drafts changes the catalog, so the entity store and the Spotlight
      // index both need to be rebuilt from the new state.
      const mutatingNames = ['createMailDraft', 'deleteMailDrafts'];
      const didMutateDrafts =
        pendingIntents.some((invocation) => mutatingNames.includes(invocation.name)) ||
        (newIntent != null && mutatingNames.includes(newIntent.name));
      if (didMutateDrafts) {
        try {
          await syncMailDraftCatalogAsync();
        } catch (error) {
          console.warn('Could not sync App Intents mail draft catalogs.', error);
        }
      }

      if (result.route) {
        navigateToAppIntentScreen(router, {
          route: result.route,
          invocationId: result.routeInvocationId,
          draftId: result.routeDraftId,
        });
      }
    } catch (error) {
      console.error(
        'Could not process the pending App Intent invocations. The App Intents example screens may show stale state; the rest of the app is unaffected.',
        error
      );
    }
  });

  return null;
}
