import * as AppIntents from 'expo-app-intents';

import {
  getMailDrafts,
  mailDraftsToEntityCatalog,
  type AppIntentMailDraft,
} from './AppIntentsStore';

/**
 * Publishes the drafts as the `mailDraft` entity catalog, which is what `MailDraftEntityQuery`
 * reads. Without it nothing can resolve a draft as an entity, so `DeleteDraftIntent` never finds
 * one to delete.
 *
 * Pass the drafts to publish a list the store has not been given yet - emptying it, say. Left out,
 * the stored drafts are read back and published.
 */
export async function syncMailDraftCatalogAsync(drafts?: AppIntentMailDraft[]): Promise<void> {
  if (!AppIntents.isAvailable()) {
    return;
  }

  const catalog = mailDraftsToEntityCatalog(drafts ?? (await getMailDrafts()));
  await AppIntents.setEntityCatalogAsync('mailDraft', catalog);
}
