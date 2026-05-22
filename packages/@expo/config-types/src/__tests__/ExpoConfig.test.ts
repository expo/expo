import fs from 'node:fs';
import path from 'node:path';

it('is not manually edited', async () => {
  const actual = await fs.promises.readFile(path.join(__dirname, '../ExpoConfig.ts'), 'utf8');
  const expected = await fs.promises.readFile(
    path.join(__dirname, 'fixtures/ExpoConfig.backup.ts'),
    'utf8'
  );

  try {
    // WARN(@kitten): Do not edit `src/ExpoConfig.ts` manually. Its changes will need to be replicated
    // to the API-side XDL schemas!
    expect(actual).toBe(expected);
  } catch (error) {
    error.message =
      'Expected src/ExpoConfig.ts and src/__tests__/fixtures/ExpoConfig.ts to match.\n' +
      'Was the file manually edited instad of being regenerated with "pnpm generate"?';
    throw error;
  }
});
