import { vol } from 'memfs';

import { fetch } from '../../utils/fetch';
import { logNewSection } from '../../utils/ora';
import { cloneTemplateAndCopyToProjectAsync } from '../updateFromTemplate';

jest.mock('../../log');
jest.mock('../../utils/fetch');
jest.mock('../../utils/ora');

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
const mockLogNewSection = logNewSection as jest.MockedFunction<typeof logNewSection>;

describe(cloneTemplateAndCopyToProjectAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it('reports a missing GitHub template without leaving native directories', async () => {
    const templateUrl =
      'https://github.com/expo/expo/tree/main/templates/this-template-does-not-exist';
    const spinner = {
      fail: jest.fn(),
    };

    mockLogNewSection.mockReturnValue(spinner as any);
    mockFetch.mockResolvedValue({ ok: false } as Response);
    vol.fromJSON({ 'package.json': '{}' }, '/project');

    await expect(
      cloneTemplateAndCopyToProjectAsync({
        projectRoot: '/project',
        templateDirectory: '/template',
        template: { type: 'repository', uri: templateUrl },
        exp: { name: 'test-app' },
        platforms: ['ios', 'android'],
      })
    ).rejects.toThrow();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/expo/expo/contents/templates/this-template-does-not-exist/package.json?ref=main'
    );
    expect(spinner.fail).toHaveBeenNthCalledWith(
      1,
      `Could not locate the repository for "${templateUrl}". Check that the repository exists and try again.`
    );
    expect(spinner.fail).toHaveBeenNthCalledWith(2, 'Failed to create the native directories');
    expect(vol.existsSync('/project/ios')).toBe(false);
    expect(vol.existsSync('/project/android')).toBe(false);
  });
});
