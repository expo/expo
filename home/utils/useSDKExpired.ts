import * as React from 'react';

import Environment from './Environment';

export function useSDKExpired(sdkVersion?: string): [boolean, number | null] {
  return React.useMemo(() => {
    // undefined or UNVERSIONED will be false since we don't know.
    const majorVersionString = sdkVersion?.split('.').shift();

    if (majorVersionString) {
      const sdkNumber = parseInt(majorVersionString, 10);
      return [sdkNumber < Environment.lowestSupportedSdkVersion, sdkNumber];
    }
    return [false, null];
  }, [sdkVersion]);
}
