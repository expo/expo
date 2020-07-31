import * as React from 'react';
import Environment from './Environment';

export function useSDKExpired(sdkVersion?: string): boolean {
  return React.useMemo<boolean>(() => {
    // undefined or UNVERSIONED will be false since we don't know.
    const majorVersionString = sdkVersion?.split('.').shift();
    if (majorVersionString) {
      const majorVersion = parseInt(majorVersionString);
      return majorVersion < Environment.lowestSupportedSdkVersion;
    }
    return false;
  }, [sdkVersion]);
}
