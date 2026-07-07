import { requireOptionalNativeModule } from 'expo-modules-core';
import * as AppIntents from 'expo-app-intents';
import type { AppIntentEntity } from 'expo-app-intents';

import {
  getJournalEntries,
  journalEntriesToEntityCatalog,
  type AppIntentJournalEntry,
} from './AppIntentsStore';

type AppIntentsSetupModule = {
  indexJournalEntriesAsync(entries: AppIntentEntity[]): Promise<void>;
};

const AppIntentsSetup = requireOptionalNativeModule<AppIntentsSetupModule>('AppIntentsSetup');

export async function syncJournalEntryCatalogAsync(
  entries?: AppIntentJournalEntry[]
): Promise<void> {
  if (!AppIntents.isAvailable()) {
    return;
  }

  const catalog = journalEntriesToEntityCatalog(entries ?? (await getJournalEntries()));
  await AppIntents.setEntityCatalogAsync('journalEntry', catalog);
  await AppIntentsSetup?.indexJournalEntriesAsync(catalog);
}
