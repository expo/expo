// note(Simek): reference https://github.com/react-native-community/directory/blob/main/pages/api/libraries/check.ts
export type ReactNativeDirectoryCheckResult = {
  unmaintained: boolean;
  newArchitecture: 'supported' | 'unsupported' | 'untested';
};

export type DirectoryCheckResponse = Record<string, ReactNativeDirectoryCheckResult>;

const MAX_PACKAGES_PER_QUERY = 50;
const ERROR_MESSAGE = 'Could not fetch packages metadata. Please try again later.';

export const checkLibraries = async (
  packageNames: string[]
): Promise<DirectoryCheckResponse | null> => {
  try {
    const chunkedPackages = chunk(packageNames, MAX_PACKAGES_PER_QUERY);

    const results = await Promise.allSettled<DirectoryCheckResponse>(
      chunkedPackages.map(async (packageChunk) => {
        const response = await fetch(
          `https://reactnative.directory/api/libraries/check?${new URLSearchParams({ packages: packageChunk.join(',') })}`
        );

        if (!response.ok) {
          throw new Error(ERROR_MESSAGE);
        }

        return (await response.json()) as DirectoryCheckResponse;
      })
    );

    return results.reduce<DirectoryCheckResponse>((acc, result) => {
      if (result.status === 'fulfilled') {
        return { ...acc, ...result.value };
      }
      throw new Error(ERROR_MESSAGE);
    }, {});
  } catch {
    return null;
  }
};

// `lodash.chunk`
export function chunk<T>(array: T[], size: number): T[][] {
  const chunked = [];
  let index = 0;
  while (index < array.length) {
    chunked.push(array.slice(index, (index += size)));
  }
  return chunked;
}
