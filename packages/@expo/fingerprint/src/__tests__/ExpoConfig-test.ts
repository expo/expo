import resolveFrom from 'resolve-from';

import { getExpoConfigAsync } from '../ExpoConfig';
import { normalizeOptionsAsync } from '../Options';

jest.mock('resolve-from');
jest.mock('../ProjectWorkflow');

describe(getExpoConfigAsync, () => {
  it('should return null if the expo package is not found', async () => {
    const result = await getExpoConfigAsync('/app', await normalizeOptionsAsync('/app'));
    const mockedResolveFrom = resolveFrom.silent as jest.MockedFunction<typeof resolveFrom.silent>;
    mockedResolveFrom.mockImplementationOnce((fromDirectory: string, moduleId: string) => {
      const actualResolver = jest.requireActual('resolve-from').silent;
      // To fake the case as no expo installed, trying to resolve as **nonexist/expo/config** module
      return actualResolver(fromDirectory, 'nonexist/expo/config');
    });

    expect(result.config).toBeNull();
    expect(result.loadedModules).toBeNull();
  });
});
