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
 */
export function isAvailable(): boolean {
  return ExpoAppIntents != null;
}

/**
 * Adds a listener invoked for live App Intent invocations dispatched while JavaScript is
 * observing. Use `getPendingInvocationsAsync` or `useAppIntents` to read invocations recorded
 * while JavaScript was not running.
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
 * after handling each one.
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
 * Returns invocations that have not been removed from the pending queue yet.
 */
export async function getPendingInvocationsAsync(): Promise<AppIntentInvocation[]> {
  if (!ExpoAppIntents) {
    return [];
  }
  return ExpoAppIntents.getPendingInvocationsAsync();
}

/**
 * Removes a handled invocation so it is no longer delivered or returned as pending.
 */
export async function removePendingInvocationAsync(id: string): Promise<void> {
  if (!ExpoAppIntents) {
    return;
  }
  return ExpoAppIntents.removePendingInvocationAsync(id);
}

/**
 * Removes all pending invocations.
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
 */
export async function getEntityCatalogAsync(kind: string): Promise<AppIntentEntity[]> {
  if (!ExpoAppIntents) {
    return [];
  }
  return ExpoAppIntents.getEntityCatalogAsync(kind);
}

/**
 * Asks the system to re-evaluate App Shortcut phrases and parameter values.
 */
export async function refreshShortcutsAsync(): Promise<void> {
  if (!ExpoAppIntents) {
    throw new UnavailabilityError('expo-app-intents', 'refreshShortcutsAsync');
  }
  return ExpoAppIntents.refreshShortcutsAsync();
}
