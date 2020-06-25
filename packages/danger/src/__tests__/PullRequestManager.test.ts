import { Octokit } from '@octokit/rest';
import { DangerDSLType } from 'danger/distribution/dsl/DangerDSL';
import { GitHubPRDSL } from 'danger/distribution/dsl/GitHubDSL';
import { mockProperty, unmockAllProperties } from 'jest-expo';

import { GithubApiWrapper } from '../GithubApiWrapper';
import {
  PullRequestManager,
  DEFAULT_CHANGELOG_ENTRY_KEY,
  ChangelogEntryType,
  ChangelogEntries,
} from '../PullRequestManager';
import { getPackageChangelogRelativePath } from '../Utils';

const message = 'Dummy pull request.';

function extendAndMockFunction<T extends Record<string, Function>, K extends keyof T>(
  object: T,
  functionName: K,
  newFunction: Function
) {
  const baseFunction = object[functionName];
  const jestFunction = jest.fn(async (...args) => {
    await baseFunction(...args);
    return await newFunction(...args);
  });
  mockProperty(object, functionName, jestFunction);
  return jestFunction;
}

function checksFileMap(
  missingEntries: { packageName: string; content: string }[],
  fileMap: Record<string, string>
) {
  missingEntries.forEach(({ packageName, content }) => {
    const changelogPath = getPackageChangelogRelativePath(packageName);
    expect(fileMap[changelogPath]).not.toBeNull();
    expect(fileMap[changelogPath]).toEqual(content);
  });
}

function checksParseChangelogSuggestionFromDescription(
  title: string,
  body: string,
  expected: ChangelogEntries
) {
  const danger = {
    github: {
      pr: {
        title,
        body,
        head: {
          ref: 'dummy ref',
        },
      },
    },
  } as DangerDSLType;
  const pullRequestManager = new PullRequestManager(
    danger.github.pr,
    new GithubApiWrapper(danger.github.api, 'danger-test-bot', 'danger-test')
  );

  const suggestions = pullRequestManager.parseChangelogSuggestionFromDescription();

  expect(suggestions).toEqual(expected);
  expect(pullRequestManager.shouldGeneratePR()).toBe(true);
}

function createDummyPR(title: string = '', body: string = '') {
  return {
    title,
    body,
    number: 123,
    head: {
      ref: 'dummy ref',
    },
  };
}

function testTitleParsing(title: string, expected: string) {
  const pullRequestManager = new PullRequestManager(createDummyPR(title), {});
  const suggestions = pullRequestManager.parseChangelogSuggestionFromDescription();

  expect(suggestions).toEqual({
    [DEFAULT_CHANGELOG_ENTRY_KEY]: { type: ChangelogEntryType.BUG_FIXES, message: expected },
  });
  expect(pullRequestManager.shouldGeneratePR()).toBe(false);
}

describe('parses pull request', () => {
  it('parse title', async () => {
    testTitleParsing(message, message);
  });

  it('tags in title should not affect suggestions', async () => {
    testTitleParsing(`[fix] ${message}`, message);
    testTitleParsing(`[expo-image-picker] ${message}`, message);
    testTitleParsing(`[expo-image-picker][fix] ${message}`, message);
    testTitleParsing(`[expo-file-system][breaking] ${message}`, message);
  });

  describe('parses body with only one entry', () => {
    it.each([
      [
        `# changelog\n${message}`,
        {
          [DEFAULT_CHANGELOG_ENTRY_KEY]: { type: ChangelogEntryType.BUG_FIXES, message },
        },
      ],
      [
        `# changelog\n [expo-image-picker] ${message}`,
        {
          [DEFAULT_CHANGELOG_ENTRY_KEY]: { type: ChangelogEntryType.BUG_FIXES, message: '' },
          'expo-image-picker': { type: ChangelogEntryType.BUG_FIXES, message },
        },
      ],
      [
        `# changelog\n [expo-image-picker][features] ${message}`,
        {
          [DEFAULT_CHANGELOG_ENTRY_KEY]: { type: ChangelogEntryType.BUG_FIXES, message: '' },
          'expo-image-picker': { type: ChangelogEntryType.NEW_FEATURES, message },
        },
      ],
      [
        `# changelog\n [expo-image-picker][features][breaking] ${message}`,
        {
          [DEFAULT_CHANGELOG_ENTRY_KEY]: { type: ChangelogEntryType.BUG_FIXES, message: '' },
          'expo-image-picker': { type: ChangelogEntryType.BREAKING_CHANGES, message },
        },
      ],
    ])('%o', (body: string, expected: ChangelogEntries) => {
      checksParseChangelogSuggestionFromDescription('', body, expected);
    });
  });
  describe('parses body with multiple entries', () => {
    it.each([
      [
        `# changelog\n${message}\n[expo-image-picker] Fix expo-image-picker`,
        {
          [DEFAULT_CHANGELOG_ENTRY_KEY]: { type: ChangelogEntryType.BUG_FIXES, message },
          'expo-image-picker': {
            type: ChangelogEntryType.BUG_FIXES,
            message: 'Fix expo-image-picker',
          },
        },
      ],
      [
        `# changelog\n [expo-image-picker] ${message}\n[breaking] Default entry`,
        {
          [DEFAULT_CHANGELOG_ENTRY_KEY]: {
            type: ChangelogEntryType.BREAKING_CHANGES,
            message: 'Default entry',
          },
          'expo-image-picker': { type: ChangelogEntryType.BUG_FIXES, message },
        },
      ],
      [
        `# changelog\n[features] ${message}\n[expo-permissions][dummy-package] Fix expo-permissions`,
        {
          [DEFAULT_CHANGELOG_ENTRY_KEY]: { type: ChangelogEntryType.NEW_FEATURES, message },
          'expo-permissions': {
            type: ChangelogEntryType.BUG_FIXES,
            message: 'Fix expo-permissions',
          },
        },
      ],
      [
        `# changelog\n [expo-image-picker][features][breaking] ${message}`,
        {
          [DEFAULT_CHANGELOG_ENTRY_KEY]: { type: ChangelogEntryType.BUG_FIXES, message: '' },
          'expo-image-picker': { type: ChangelogEntryType.BREAKING_CHANGES, message },
        },
      ],
      [
        `# changelog\n- [expo-image-picker] Fix expo-image-picker\n- [expo-permissions][breaking] Fix expo-permissions\n[unimodules-app-loader][bug-fix] Fix unimodules-app-loader\n- ${message}`,
        {
          [DEFAULT_CHANGELOG_ENTRY_KEY]: { type: ChangelogEntryType.BUG_FIXES, message },
          'expo-image-picker': {
            type: ChangelogEntryType.BUG_FIXES,
            message: 'Fix expo-image-picker',
          },
          'expo-permissions': {
            type: ChangelogEntryType.BREAKING_CHANGES,
            message: 'Fix expo-permissions',
          },
          'unimodules-app-loader': {
            type: ChangelogEntryType.BUG_FIXES,
            message: 'Fix unimodules-app-loader',
          },
        },
      ],
    ])('%o', (body: string, expected: ChangelogEntries) => {
      checksParseChangelogSuggestionFromDescription('', body, expected);
    });
  });
  it('removes white characters', () => {
    const title = `[ios][danger] \t ${message}  \t`;
    const body = `# changelog\n \t - \t [ ][x][expo-image-picker][breaking] \t ${message} \t `;
    const expected = {
      [DEFAULT_CHANGELOG_ENTRY_KEY]: { type: ChangelogEntryType.BUG_FIXES, message },
      'expo-image-picker': {
        type: ChangelogEntryType.BREAKING_CHANGES,
        message,
      },
    };
    checksParseChangelogSuggestionFromDescription(title, body, expected);
  });
});

describe('creates/updates PR', () => {
  describe('createOrUpdatePRAsync', () => {
    const pullRequest = {
      head: {
        ref: 'pull-request-ref',
      },
      number: 123,
      body: `dummy body`,
    } as GitHubPRDSL;
    const dummyPullRequest = {
      title: 'dummy pull request',
      body: 'dummy body',
    };
    const missingEntires = [
      {
        packageName: 'expo-image-picker',
        content: 'expo-image-picker changelog',
      },
      {
        packageName: 'expo-permissions',
        content: 'expo-permissions changelog',
      },
      {
        packageName: 'expo-file-system',
        content: 'expo-file-system changelog',
      },
    ];
    const githubApiWrapper = new GithubApiWrapper({} as Octokit, 'danger-test-bot', 'danger-test');
    const pullRequestManager = new PullRequestManager(pullRequest, githubApiWrapper);

    beforeEach(() => {
      // add default branches check
      let dangerBranchName;
      const checksBranches = (options: { fromBranch: string; toBranch: string }) => {
        expect(options).not.toBeNull();
        expect(options.fromBranch).toEqual(dangerBranchName);
        expect(options.toBranch).toEqual(pullRequest.head.ref);
      };

      mockProperty(githubApiWrapper, 'createOrUpdateBranchFromFileMap', (_, config) => {
        dangerBranchName = config.branchName;
      });
      mockProperty(githubApiWrapper, 'getOpenPRs', checksBranches);
      mockProperty(githubApiWrapper, 'openPR', checksBranches);
    });

    afterEach(() => {
      unmockAllProperties(githubApiWrapper);
    });

    it('create pr', async () => {
      const createOrUpdateBranchFromFileMapMock = extendAndMockFunction(
        githubApiWrapper,
        'createOrUpdateBranchFromFileMap',
        (fileMap: Record<string, string>, config: { baseBranchName: any; branchName: any }) => {
          checksFileMap(missingEntires, fileMap);
          expect(config).not.toBeNull();
          expect(config.baseBranchName).toEqual(pullRequest.head.ref);
          expect(config.branchName).toContain(pullRequest.number);
        }
      );

      const getOpenPRsMock = extendAndMockFunction(githubApiWrapper, 'getOpenPRs', () => {
        return [];
      });

      const openPRMock = extendAndMockFunction(githubApiWrapper, 'openPR', options => {
        expect(options.title).toContain(`#${pullRequest.number}`);
        expect(options.body).toContain(`#${pullRequest.number}`);
        return dummyPullRequest;
      });

      const result = await pullRequestManager.createOrUpdatePRAsync(missingEntires);

      expect(result).toBe(dummyPullRequest);
      [createOrUpdateBranchFromFileMapMock, getOpenPRsMock, openPRMock].forEach(fn => {
        expect(fn.mock.calls.length).toBe(1);
      });
    });

    it('update pr', async () => {
      extendAndMockFunction(githubApiWrapper, 'getOpenPRs', () => [dummyPullRequest]);
      const openPRMock = extendAndMockFunction(githubApiWrapper, 'openPR', () => {});

      const result = await pullRequestManager.createOrUpdatePRAsync(missingEntires);

      expect(openPRMock.mock.calls.length).toBe(0);
      expect(result).toBe(dummyPullRequest);
    });
  });
});
