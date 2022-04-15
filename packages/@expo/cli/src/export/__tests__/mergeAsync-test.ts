import { vol } from 'memfs';

import { downloadSourcesAsync } from '../mergeAsync';

jest.mock('../../utils/tar', () => ({
  async downloadAndDecompressAsync(url: string, destination: string): Promise<string> {
    return destination;
  },
}));

describe(downloadSourcesAsync, () => {
  afterAll(() => {
    vol.reset();
  });

  it(`downloads tar files`, async () => {
    vol.fromJSON({});

    const directories = await downloadSourcesAsync(['expo.dev/app.tar.gz']);
    expect(directories.length).toBe(1);
    // Ensure the file was downloaded with the expected name
    expect(directories[0]).toMatch(/\/alpha\/\.tmp\/app_/);

    // Ensure the tmp directory was created and the file was added
    expect(vol.existsSync(directories[0])).toBe(true);
  });
});
