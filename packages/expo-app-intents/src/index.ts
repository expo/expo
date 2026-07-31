import { type EventSubscription, UnavailabilityError } from 'expo-modules-core';
import { useEffect, useRef } from 'react';

import type {
  AppIntentEntity,
  AppIntentInvocation,
  AppIntentsHandler,
} from './ExpoAppIntents.types';
import ExpoAppIntents from './ExpoAppIntentsModule';

export type * from './ExpoAppIntents.types';

/**
 * Returns whether App Intents are available on this device.
 * Returns `false` on Android, and web.
 *
 * > **Note:** Every other function in this module is safe to call when App Intents are
 * > unavailable. Mutations resolve without doing anything, queries resolve with an empty result,
 * > and `useAppIntents` calls its handler once with an empty snapshot and never again. The one
 * > exception is `refreshShortcutsAsync`, which throws `UnavailabilityError` because a caller
 * > asking for a refresh has no other way to learn it did not happen. Call this function when
 * > your own code needs to know, for example to hide a "Add to Siri" button.
 */
export function isAvailable(): boolean {
  return ExpoAppIntents != null;
}

/**
 * Adds a listener invoked for live App Intent invocations dispatched while JavaScript is
 * observing. Use `getPendingInvocationsAsync` or `useAppIntents` to read invocations recorded
 * while JavaScript was not running.
 *
 * Returns a subscription that does nothing when App Intents are unavailable.
 */
export function addAppIntentListener(
  listener: (invocation: AppIntentInvocation) => void
): EventSubscription {
  if (!ExpoAppIntents) {
    return { remove() {} };
  }
  return ExpoAppIntents.addListener('onIntent', listener);
}

function callAppIntentsHandler(
  handler: AppIntentsHandler,
  pendingIntents: AppIntentInvocation[],
  newIntent: AppIntentInvocation | null
) {
  Promise.resolve(handler(pendingIntents, newIntent)).catch((error: unknown) => {
    console.warn('Unhandled error in useAppIntents handler.', error);
  });
}

/**
 * Calls `handler` once with the pending invocations recorded while JavaScript was cold, then
 * again for every new invocation received while the component is mounted.
 *
 * `newIntent` is `null` for the initial pending snapshot. Later calls include the current
 * pending snapshot and the new invocation that triggered the call.
 * Pending invocations are not removed automatically; call `removePendingInvocationAsync(id)`
 * after handling each one. The queue holds at most 100 invocations, and once it is full the oldest
 * are dropped to make room, so a handler that never removes them does eventually lose invocations.
 *
 * The handler is called with an empty snapshot, and never again, when App Intents are unavailable.
 */
export function useAppIntents(handler: AppIntentsHandler): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    let isMounted = true;
    const seenLiveInvocationIds = new Set<string>();

    const notify = (
      pendingIntents: AppIntentInvocation[],
      newIntent: AppIntentInvocation | null
    ) => {
      if (!isMounted) {
        return;
      }
      callAppIntentsHandler(handlerRef.current, pendingIntents, newIntent);
    };

    const handleNewIntent = async (newIntent: AppIntentInvocation) => {
      if (seenLiveInvocationIds.has(newIntent.id)) {
        return;
      }
      seenLiveInvocationIds.add(newIntent.id);

      try {
        const pendingIntents = await getPendingInvocationsAsync();
        notify(pendingIntents.length > 0 ? pendingIntents : [newIntent], newIntent);
      } catch (error) {
        if (isMounted) {
          console.error('Could not read pending App Intents invocations.', error);
          notify([newIntent], newIntent);
        }
      }
    };

    const readInitialPendingIntents = async () => {
      try {
        const pendingIntents = await getPendingInvocationsAsync();
        notify(
          pendingIntents.filter((invocation) => !seenLiveInvocationIds.has(invocation.id)),
          null
        );
      } catch (error) {
        if (isMounted) {
          console.error('Could not read pending App Intents invocations.', error);
          notify([], null);
        }
      }
    };

    // Attach the live listener first so an invocation cannot arrive between reading pending
    // invocations and subscribing to future ones.
    const subscription = addAppIntentListener((newIntent) => {
      handleNewIntent(newIntent).then();
    });

    readInitialPendingIntents().then();

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);
}

/**
 * Returns invocations that have not been removed from the pending queue yet, oldest first.
 * Resolves with an empty array when App Intents are unavailable.
 *
 * At most 100 invocations are kept. An app that never removes them keeps only the newest 100.
 *
 * Rejects when the stored queue cannot be read, which means the invocations waiting in it are not
 * delivered. The queue starts empty afterwards, so a later call succeeds.
 */
export async function getPendingInvocationsAsync(): Promise<AppIntentInvocation[]> {
  if (!ExpoAppIntents) {
    return [];
  }
  return ExpoAppIntents.getPendingInvocationsAsync();
}

/**
 * Removes a handled invocation so it is no longer delivered or returned as pending.
 * Does nothing when App Intents are unavailable.
 *
 * Rejects when the stored queue cannot be read or written, so a failure to forget a handled
 * invocation is not mistaken for success. A rejection caused by an unreadable queue leaves nothing
 * pending at all: the unreadable data is set aside, so every invocation that was waiting in it is
 * gone, not only this one.
 */
export async function removePendingInvocationAsync(id: string): Promise<void> {
  if (!ExpoAppIntents) {
    return;
  }
  return ExpoAppIntents.removePendingInvocationAsync(id);
}

/**
 * Removes all pending invocations.
 * Does nothing when App Intents are unavailable.
 */
export async function clearPendingInvocationsAsync(): Promise<void> {
  if (!ExpoAppIntents) {
    return;
  }
  return ExpoAppIntents.clearPendingInvocationsAsync();
}

/**
 * Replaces the entity catalog of the given kind and asks the system to re-train
 * parameterized shortcut phrases against the new values.
 *
 * The native store is UserDefaults-backed, so keep catalogs compact. For large
 * datasets such as thousands of contacts, songs, or menu items, store the full
 * data in your app and publish only the subset that Siri and Shortcuts need.
 *
 * Every entity needs a non-empty `id` and `title`, because Siri and Shortcuts cannot resolve one
 * without them. The whole catalog is rejected, and the previous one kept, when an entity is
 * missing either.
 *
 * A rejection always means the catalog was kept out, so the previous one is still the one Siri and
 * Shortcuts resolve against. Re-training the phrases is separate: it is attempted after the catalog
 * is stored and its outcome is never reported here, because the write it follows has already
 * succeeded. Phrases are therefore left untrained, with no rejection to go on, when the iOS app
 * target has no `AppIntentsSetup` inline module to register a refresh handler, and in the first
 * moments after launch, because the generated `AppIntentsSetup` registers the handler from a
 * detached task. Call `refreshShortcutsAsync` to re-train phrases for a catalog that is already
 * stored — that one does report whether the re-training ran.
 *
 * Does nothing when App Intents are unavailable.
 */
export async function setEntityCatalogAsync(
  kind: string,
  entities: AppIntentEntity[]
): Promise<void> {
  if (!ExpoAppIntents) {
    return;
  }
  return ExpoAppIntents.setEntityCatalogAsync(kind, entities);
}

/**
 * Returns the current entity catalog of the given kind.
 * Resolves with an empty array when the kind was never published, and when App Intents are
 * unavailable.
 *
 * Rejects when the stored catalog cannot be read, so an unreadable catalog is not mistaken for an
 * empty one. Publishing the kind again with `setEntityCatalogAsync` replaces it.
 */
export async function getEntityCatalogAsync(kind: string): Promise<AppIntentEntity[]> {
  if (!ExpoAppIntents) {
    return [];
  }
  return ExpoAppIntents.getEntityCatalogAsync(kind);
}

/**
 * Asks the system to re-evaluate App Shortcut phrases and parameter values.
 *
 * Throws `UnavailabilityError` when App Intents are unavailable, and throws when they are available
 * but the app has no `AppShortcutsProvider`, and so nothing to refresh. Unlike the other functions
 * here, this one has no meaningful no-op: the caller asked for a refresh and needs to know it did
 * not happen. Publishing a catalog with `setEntityCatalogAsync` also refreshes shortcuts, and does
 * not throw when there is no provider.
 */
export async function refreshShortcutsAsync(): Promise<void> {
  if (!ExpoAppIntents) {
    throw new UnavailabilityError('expo-app-intents', 'refreshShortcutsAsync');
  }
  return ExpoAppIntents.refreshShortcutsAsync();
}
