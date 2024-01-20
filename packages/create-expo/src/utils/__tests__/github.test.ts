import { getGithubUrlInfo } from '../github';

describe(getGithubUrlInfo, () => {
  it(`returns null without "owner" and/or "name"`, () => {
    expect(getGithubUrlInfo('https://expo.dev')).toBeNull();
    expect(getGithubUrlInfo('https://github.com')).toBeNull();
    expect(getGithubUrlInfo('https://github.com/acme')).toBeNull();
  });

  it('parses url with "owner" and "name"', () => {
    expect(getGithubUrlInfo('https://github.com/acme/project')).toEqual({
      url: 'https://github.com/acme/project',
      owner: 'acme',
      name: 'project',
      ref: undefined,
      folder: undefined,
    });
    // This contains `/tree`, but not with a value
    expect(getGithubUrlInfo('https://github.com/acme/project/tree')).toEqual({
      url: 'https://github.com/acme/project/tree',
      owner: 'acme',
      name: 'project',
      ref: undefined,
      folder: undefined,
    });
  });

  it('parses url with "owner", "name", and "ref"', () => {
    // Using branch as `ref`
    expect(getGithubUrlInfo('https://github.com/acme/project/tree/some-branch')).toEqual({
      url: 'https://github.com/acme/project/tree/some-branch',
      owner: 'acme',
      name: 'project',
      ref: 'some-branch',
      folder: undefined,
    });
    // Using tag as `ref`
    expect(getGithubUrlInfo('https://github.com/acme/project/tree/v8')).toEqual({
      url: 'https://github.com/acme/project/tree/v8',
      owner: 'acme',
      name: 'project',
      ref: 'v8',
      folder: undefined,
    });
    // Using commit as `ref`
    expect(
      getGithubUrlInfo(
        'https://github.com/acme/project/tree/3a17f53c99edece279efc5bb287d3194472ac2e7'
      )
    ).toEqual({
      url: 'https://github.com/acme/project/tree/3a17f53c99edece279efc5bb287d3194472ac2e7',
      owner: 'acme',
      name: 'project',
      ref: '3a17f53c99edece279efc5bb287d3194472ac2e7',
      folder: undefined,
    });
  });

  it('parses url with "owner", "name", "ref", and "folder"', () => {
    // Using branch as `ref`
    expect(
      getGithubUrlInfo('https://github.com/acme/project/tree/some-branch/some/folder')
    ).toEqual({
      url: 'https://github.com/acme/project/tree/some-branch/some/folder',
      owner: 'acme',
      name: 'project',
      ref: 'some-branch',
      folder: 'some/folder',
    });
    // Using tag as `ref`
    expect(
      getGithubUrlInfo('https://github.com/acme/project/tree/v8/other/deeply/nested/folder')
    ).toEqual({
      url: 'https://github.com/acme/project/tree/v8/other/deeply/nested/folder',
      owner: 'acme',
      name: 'project',
      ref: 'v8',
      folder: 'other/deeply/nested/folder',
    });
    // Using commit as `ref`
    expect(
      getGithubUrlInfo(
        'https://github.com/acme/project/tree/3a17f53c99edece279efc5bb287d3194472ac2e7/not/sure/why/people/would/do/this/but/it/should/work'
      )
    ).toEqual({
      url: 'https://github.com/acme/project/tree/3a17f53c99edece279efc5bb287d3194472ac2e7/not/sure/why/people/would/do/this/but/it/should/work',
      owner: 'acme',
      name: 'project',
      ref: '3a17f53c99edece279efc5bb287d3194472ac2e7',
      folder: 'not/sure/why/people/would/do/this/but/it/should/work',
    });
  });
});
