import * as AppIntents from 'expo-app-intents';

import {
  getMailDrafts,
  mailDraftsToEntityCatalog,
  type AppIntentMailDraft,
} from './AppIntentsStore';

/**
 * Publishes the drafts as the `mailDraft` entity catalog. The entity is registered natively with
 * `registerIndexed`, so this also rebuilds its Spotlight index, and republishing an unchanged
 * catalog does nothing.
 */
export async function syncMailDraftCatalogAsync(drafts?: AppIntentMailDraft[]): Promise<void> {
  if (!AppIntents.isAvailable()) {
    return;
  }

  const catalog = mailDraftsToEntityCatalog(drafts ?? (await getMailDrafts()));
  await AppIntents.setEntityCatalogAsync('mailDraft', catalog);
}
