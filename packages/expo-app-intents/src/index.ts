import { type EventSubscription, UnavailabilityError } from 'expo-modules-core';
import { useEffect, useRef } from 'react';

import type {
  AppEntityIdentifierModifier,
  AppIntentEntity,
  AppIntentInvocation,
  AppIntentsHandler,
} from './ExpoAppIntents.types';
import ExpoAppIntents from './ExpoAppIntentsModule';

export type * from './ExpoAppIntents.types';

const MAX_SEEN_INVOCATION_IDS = 100;

/**
 * Returns whether App Intents are available on this device.
 * Returns `false` on Android and web.
 */
export function isAvailable(): boolean {
  return ExpoAppIntents != null;
}

/**
 * Adds a listener for live App Intent invocations dispatched while JavaScript is observing.
 *
 * > Pending invocations recorded while JavaScript was not running are available through
 * > [`getPendingInvocationsAsync()`](#appintentsgetpendinginvocationsasync) or
 * > [`useAppIntents()`](#useappintentshandler).
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
  return Promise.resolve()
    .then(() => handler(pendingIntents, newIntent))
    .catch((error: unknown) => {
      console.warn('Unhandled error in useAppIntents handler.', error);
    });
}

/**
 * Calls `handler` once with the pending invocations recorded while JavaScript was not running,
 * then again for every new invocation received while the component is mounted.
 *
 * `newIntent` is `null` for the initial pending snapshot. Later calls include the current
 * pending snapshot and the new invocation that triggered the call. The initial call is always
 * delivered first, and new invocations are delivered one at a time in arrival order.
 * Pending invocations are not removed automatically. The handler must call
 * [`removePendingInvocationAsync(id)`](#appintentsremovependinginvocationasyncid)
 * after handling each one. The queue holds at most 100 invocations, and once it is full the oldest
 * are dropped to make room, so a handler that never removes them does eventually lose invocations.
 *
 * When App Intents are unavailable, this hook calls the handler with an empty snapshot and does
 * not call it again.
 */
export function useAppIntents(handler: AppIntentsHandler): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    let isMounted = true;
    const seenLiveInvocationIds = new Set<string>();
    let deliveryQueue: Promise<void> = Promise.resolve();
    const enqueue = (deliver: () => Promise<void>) => {
      deliveryQueue = deliveryQueue.then(deliver);
    };

    const notify = (
      pendingIntents: AppIntentInvocation[],
      newIntent: AppIntentInvocation | null
    ) => {
      if (!isMounted) {
        return;
      }
      return callAppIntentsHandler(handlerRef.current, pendingIntents, newIntent);
    };

    const deliverNewIntent = async (newIntent: AppIntentInvocation) => {
      try {
        const pendingIntents = await getPendingInvocationsAsync();
        await notify(pendingIntents.length > 0 ? pendingIntents : [newIntent], newIntent);
      } catch (error) {
        if (isMounted) {
          console.error('Could not read pending App Intents invocations.', error);
          await notify([newIntent], newIntent);
        }
      }
    };

    const deliverInitialPendingIntents = async () => {
      try {
        const pendingIntents = await getPendingInvocationsAsync();
        const initialPendingIntents = pendingIntents.filter(
          (invocation) => !seenLiveInvocationIds.has(invocation.id)
        );
        initialPendingIntents.forEach(({ id }) => seenLiveInvocationIds.add(id));
        await notify(initialPendingIntents, null);
      } catch (error) {
        if (isMounted) {
          console.error('Could not read pending App Intents invocations.', error);
          await notify([], null);
        }
      }
    };

    // Attach the live listener first so an invocation cannot arrive between reading pending
    // invocations and subscribing to future ones.
    const subscription = addAppIntentListener((newIntent) => {
      if (seenLiveInvocationIds.has(newIntent.id)) {
        return;
      }
      seenLiveInvocationIds.add(newIntent.id);
      if (seenLiveInvocationIds.size > MAX_SEEN_INVOCATION_IDS) {
        seenLiveInvocationIds.delete(seenLiveInvocationIds.values().next().value!);
      }
      enqueue(() => deliverNewIntent(newIntent));
    });

    enqueue(() => deliverInitialPendingIntents());

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);
}

/**
 * Returns invocations that have not been removed from the pending queue yet, oldest first.
 * The returned promise is fulfilled with an empty array when App Intents are unavailable.
 *
 * The queue keeps at most 100 invocations. An app that never removes them keeps only the newest
 * 100.
 *
 * The returned promise is rejected when the stored queue cannot be read. In this case, the
 * invocations waiting in the queue are not delivered. The queue starts empty afterward, so a later
 * call succeeds.
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
 * The returned promise is rejected when the stored queue cannot be read or written. A rejection
 * caused by an unreadable queue leaves nothing pending. The native layer sets aside the unreadable
 * data, so it removes every invocation that was waiting in the queue instead of only this one.
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
 * Replaces the entity catalog of the given kind and asks the system to retrain
 * parameterized shortcut phrases against the new values.
 *
 * The native store uses `UserDefaults`, which is best suited to compact catalogs. For large
 * datasets, such as thousands of contacts or songs, apps should store the full data locally and
 * publish only the subset that Siri and Shortcuts need.
 *
 * When `kind` or an entity is invalid, the returned promise is rejected and the previous catalog
 * remains available. The `kind` is invalid when it is empty or contains only whitespace. An entity
 * is invalid when its `id` or `title` is empty or contains only whitespace. An entity is also
 * invalid when another entity in the catalog has the same `id`.
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
 * The returned promise is fulfilled with an empty array when the kind was never published or App
 * Intents are unavailable.
 *
 * The returned promise is rejected when the stored catalog cannot be read.
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
 * The returned promise is rejected with `UnavailabilityError` when App Intents are unavailable. It
 * is also rejected when the app has no `AppShortcutsProvider` to refresh. Publishing a catalog with
 * [`setEntityCatalogAsync()`](#appintentssetentitycatalogasynckind-entities) also refreshes
 * shortcuts.
 */
export async function refreshShortcutsAsync(): Promise<void> {
  if (!ExpoAppIntents) {
    throw new UnavailabilityError('expo-app-intents', 'refreshShortcutsAsync');
  }
  return ExpoAppIntents.refreshShortcutsAsync();
}

/**
 * Returns an ExpoUI SwiftUI modifier config that ties a view to an AppEntity identifier.
 *
 * The `entity` value must be registered from app-target Swift with
 * `AppEntityIdentifierRegistry.shared.register(_:as:)`.
 */
export function appEntityIdentifier(entity: string, id: string): AppEntityIdentifierModifier {
  return {
    $type: 'appEntityIdentifier',
    entity,
    id,
  };
}
