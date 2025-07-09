import { getSettings } from '../../../api/user/UserSettings';

/** Get the cached code signing ID from the last time a user configured code signing via the CLI. */
export async function getLastDeveloperCodeSigningIdAsync(): Promise<string | null> {
  return await getSettings().getAsync('developmentCodeSigningId', null);
}

/** Cache the code signing ID that the user chose for their project, we'll recommend this value for the next project they code sign. */
export async function setLastDeveloperCodeSigningIdAsync(id: string): Promise<void> {
  await getSettings()
    .setAsync('developmentCodeSigningId', id)
    .catch(() => {});
}
