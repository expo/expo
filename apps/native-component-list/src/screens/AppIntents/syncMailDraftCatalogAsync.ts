import * as AppIntents from 'expo-app-intents';
import type { AppIntentEntity } from 'expo-app-intents';
import { requireOptionalNativeModule } from 'expo-modules-core';

import {
  getMailDrafts,
  mailDraftsToEntityCatalog,
  type AppIntentMailDraft,
} from './AppIntentsStore';

type AppIntentsSetupModule = {
  indexMailDraftsAsync(drafts: AppIntentEntity[]): Promise<void>;
};

const AppIntentsSetup = requireOptionalNativeModule<AppIntentsSetupModule>('AppIntentsSetup');

/**
 * Publishes the drafts as the `mailDraft` entity catalog, which is what `MailDraftEntityQuery`
 * reads, and pushes the same records into Spotlight through the app-target setup module.
 * Republishing an unchanged catalog does nothing.
 */
export async function syncMailDraftCatalogAsync(drafts?: AppIntentMailDraft[]): Promise<void> {
  if (!AppIntents.isAvailable()) {
    return;
  }

  const catalog = mailDraftsToEntityCatalog(drafts ?? (await getMailDrafts()));
  await AppIntents.setEntityCatalogAsync('mailDraft', catalog);
  await AppIntentsSetup?.indexMailDraftsAsync(catalog);
}
