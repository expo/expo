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

export async function syncMailDraftCatalogAsync(drafts?: AppIntentMailDraft[]): Promise<void> {
  if (!AppIntents.isAvailable()) {
    return;
  }

  const catalog = mailDraftsToEntityCatalog(drafts ?? (await getMailDrafts()));
  await AppIntents.setEntityCatalogAsync('mailDraft', catalog);
  await AppIntentsSetup?.indexMailDraftsAsync(catalog);
}
