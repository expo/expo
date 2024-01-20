import { getGithubUrlInfo } from '../github';

describe(getGithubUrlInfo, () => {
  it(`returns null without "owner" and/or "name"`, () => {
    expect(getGithubUrlInfo('https://expo.dev')).toBeNull();
    expect(getGithubUrlInfo('https://github.com')).toBeNull();
    expect(getGithubUrlInfo('https://github.com/acme')).toBeNull();
  });

  it('parses url with "owner" and "name"', () => {
    expect(getGithubUrlInfo('https://github.com/acme/project')).toEqual({
      owner: 'acme',
      name: 'project',
    });
    // This contains `/tree`, but not with a value
    expect(getGithubUrlInfo('https://github.com/acme/project/tree')).toEqual({
      owner: 'acme',
      name: 'project',
    });
  });

  it('parses url with "owner", "name", and "ref"', () => {
    // Using branch as `ref`
    expect(getGithubUrlInfo('https://github.com/acme/project/tree/some-branch')).toEqual({
      owner: 'acme',
      name: 'project',
      ref: 'some-branch',
    });
    // Using tag as `ref`
    expect(getGithubUrlInfo('https://github.com/acme/project/tree/v8')).toEqual({
      owner: 'acme',
      name: 'project',
      ref: 'v8',
    });
    // Using commit as `ref`
    expect(
      getGithubUrlInfo(
        'https://github.com/acme/project/tree/3a17f53c99edece279efc5bb287d3194472ac2e7'
      )
    ).toEqual({
      owner: 'acme',
      name: 'project',
      ref: '3a17f53c99edece279efc5bb287d3194472ac2e7',
    });
  });

  it('parses url with "owner", "name", "ref", and "folder"', () => {
    // Using branch as `ref`
    expect(
      getGithubUrlInfo('https://github.com/acme/project/tree/some-branch/some/folder')
    ).toEqual({
      owner: 'acme',
      name: 'project',
      ref: 'some-branch',
      folder: 'some/folder',
    });
    // Using tag as `ref`
    expect(
      getGithubUrlInfo('https://github.com/acme/project/tree/v8/other/deeply/nested/folder')
    ).toEqual({
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
      owner: 'acme',
      name: 'project',
      ref: '3a17f53c99edece279efc5bb287d3194472ac2e7',
      folder: 'not/sure/why/people/would/do/this/but/it/should/work',
    });
  });
});
