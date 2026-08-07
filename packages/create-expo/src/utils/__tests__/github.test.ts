import nock from 'nock';

import { downloadAndExtractGitHubRepositoryAsync } from '../github';
import { extractNpmTarballAsync } from '../npm';

jest.mock('../npm', () => ({
  ...jest.requireActual('../npm'),
  extractNpmTarballAsync: jest.fn(async () => '/output'),
}));

const mockExtractNpmTarballAsync = extractNpmTarballAsync as jest.MockedFunction<
  typeof extractNpmTarballAsync
>;

/** Reply to the "does this repository contain a package.json" check. */
function mockContentsRequest(path: string, status = 200) {
  return nock('https://api.github.com').get(path).reply(status);
}

/** Reply to the tarball download from codeload. */
function mockTarballRequest(path: string, status = 200) {
  return nock('https://codeload.github.com').get(path).reply(status, 'tarball');
}

describe(downloadAndExtractGitHubRepositoryAsync, () => {
  afterEach(() => {
    nock.cleanAll();
    jest.clearAllMocks();
  });

  it('resolves the default branch when the url has no branch', async () => {
    const repo = nock('https://api.github.com')
      .get('/repos/expo/examples')
      .reply(200, { default_branch: 'main' });
    const contents = mockContentsRequest('/repos/expo/examples/contents/package.json?ref=main');
    const tarball = mockTarballRequest('/expo/examples/tar.gz/main');

    await expect(
      downloadAndExtractGitHubRepositoryAsync(new URL('https://github.com/expo/examples'), '/out', {
        expName: 'my-app',
      })
    ).resolves.toBe('/output');

    repo.done();
    contents.done();
    tarball.done();
    // Only the root folder added by GitHub is stripped.
    expect(mockExtractNpmTarballAsync).toHaveBeenCalledWith(
      expect.anything(),
      '/out',
      expect.objectContaining({ expName: 'my-app', strip: 1 })
    );
  });

  it('uses the branch from the url without querying the api', async () => {
    const contents = mockContentsRequest('/repos/expo/examples/contents/package.json?ref=beta');
    const tarball = mockTarballRequest('/expo/examples/tar.gz/beta');

    await expect(
      downloadAndExtractGitHubRepositoryAsync(
        new URL('https://github.com/expo/examples/tree/beta'),
        '/out',
        { expName: 'my-app' }
      )
    ).resolves.toBe('/output');

    contents.done();
    tarball.done();
  });

  it('strips the sub directory from the url', async () => {
    const contents = mockContentsRequest(
      '/repos/expo/examples/contents/with-router/package.json?ref=main'
    );
    const tarball = mockTarballRequest('/expo/examples/tar.gz/main');

    await expect(
      downloadAndExtractGitHubRepositoryAsync(
        new URL('https://github.com/expo/examples/tree/main/with-router'),
        '/out',
        { expName: 'my-app' }
      )
    ).resolves.toBe('/output');

    contents.done();
    tarball.done();
    // Both the root folder added by GitHub and the sub directory are stripped.
    expect(mockExtractNpmTarballAsync).toHaveBeenCalledWith(
      expect.anything(),
      '/out',
      expect.objectContaining({ strip: 2 })
    );
  });

  it('throws when the repository does not exist', async () => {
    const repo = nock('https://api.github.com').get('/repos/expo/private').reply(404);

    await expect(
      downloadAndExtractGitHubRepositoryAsync(new URL('https://github.com/expo/private'), '/out', {
        expName: 'my-app',
      })
    ).rejects.toThrow('GitHub repository not found for url: https://github.com/expo/private');

    repo.done();
  });

  it('throws on an unexpected api response', async () => {
    const repo = nock('https://api.github.com').get('/repos/expo/examples').reply(500);

    await expect(
      downloadAndExtractGitHubRepositoryAsync(new URL('https://github.com/expo/examples'), '/out', {
        expName: 'my-app',
      })
    ).rejects.toThrow('[500] Failed to fetch GitHub repository information');

    repo.done();
  });

  it('throws for a url that is not a tree', async () => {
    await expect(
      downloadAndExtractGitHubRepositoryAsync(
        new URL('https://github.com/expo/examples/blob/main/package.json'),
        '/out',
        { expName: 'my-app' }
      )
    ).rejects.toThrow('Malformed GitHub repository response for URL');
  });

  it('throws when the repository has no package.json', async () => {
    const contents = mockContentsRequest(
      '/repos/expo/examples/contents/package.json?ref=main',
      404
    );

    await expect(
      downloadAndExtractGitHubRepositoryAsync(
        new URL('https://github.com/expo/examples/tree/main'),
        '/out',
        { expName: 'my-app' }
      )
    ).rejects.toThrow('Could not locate repository');

    contents.done();
    expect(mockExtractNpmTarballAsync).not.toHaveBeenCalled();
  });

  it('throws when the tarball response has no body', async () => {
    const contents = mockContentsRequest('/repos/expo/examples/contents/package.json?ref=main');
    const tarball = nock('https://codeload.github.com')
      .get('/expo/examples/tar.gz/main')
      .reply(204);

    await expect(
      downloadAndExtractGitHubRepositoryAsync(
        new URL('https://github.com/expo/examples/tree/main'),
        '/out',
        { expName: 'my-app' }
      )
    ).rejects.toThrow('Unexpected response: no response body');

    contents.done();
    tarball.done();
  });

  it('throws when the tarball can not be downloaded', async () => {
    const contents = mockContentsRequest('/repos/expo/examples/contents/package.json?ref=main');
    const tarball = mockTarballRequest('/expo/examples/tar.gz/main', 500);

    await expect(
      downloadAndExtractGitHubRepositoryAsync(
        new URL('https://github.com/expo/examples/tree/main'),
        '/out',
        { expName: 'my-app' }
      )
    ).rejects.toThrow('Unexpected response');

    contents.done();
    tarball.done();
  });
});
