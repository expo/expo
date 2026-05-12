export const checkLibraries = async (
  packageNames: string[]
): Promise<Record<string, ReactNativeDirectoryCheckResult> | null> => {
  try {
    const response = await fetch(
      `https://reactnative.directory/api/libraries/check?packages=${packageNames.join(',')}`
    );
    if (response.ok) {
      return (await response.json()) as Record<string, ReactNativeDirectoryCheckResult>;
    } else {
      return null;
    }
  } catch {
    return null;
  }
};

// See: https://github.com/react-native-community/directory/blob/1fb5e7b899e021a18f14b3c32b79d8d5995022d6/pages/api/libraries/check.ts#L8-L17
export type ReactNativeDirectoryCheckResult = {
  unmaintained: boolean;
  // See: https://github.com/react-native-community/directory/blob/1fb5e7b899e021a18f14b3c32b79d8d5995022d6/util/newArchStatus.ts#L3-L7
  newArchitecture: 'supported' | 'unsupported' | 'untested';
};
