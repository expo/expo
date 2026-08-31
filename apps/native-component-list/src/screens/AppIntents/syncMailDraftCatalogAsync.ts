import * as AppIntents from 'expo-app-intents';

import { getMailDrafts, mailDraftsToEntityCatalog } from './AppIntentsStore';

let syncQueue: Promise<void> = Promise.resolve();

/**
 * Publishes the drafts as the `mailDraft` entity catalog. The entity is registered natively with
 * `registerIndexed`, so this also rebuilds its Spotlight index, and republishing an unchanged
 * catalog does nothing.
 */
export function syncMailDraftCatalogAsync(): Promise<void> {
  if (!AppIntents.isAvailable()) {
    return Promise.resolve();
  }

  const sync = async () => {
    // Read only once this sync reaches the front of the queue. Callers can request a sync while a
    // previous Spotlight update is still running; publishing a captured snapshot here could then
    // restore drafts that a later store update already removed.
    const catalog = mailDraftsToEntityCatalog(await getMailDrafts());
    await AppIntents.setEntityCatalogAsync('mailDraft', catalog);
  };
  const result = syncQueue.then(sync, sync);
  syncQueue = result.catch(() => {});
  return result;
}
