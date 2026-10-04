'use client';
import * as React from 'react';

import type { NativeStackDescriptorMap } from '../types';

export function useInvalidPreventRemoveError(
  descriptors: NativeStackDescriptorMap,
  isRemovalPrevented: (key: string) => boolean
) {
  // TODO(@ubax): remove this hook later.
  const preventedDescriptor = Object.values(descriptors).find(
    ({ route }) => route.key !== undefined && isRemovalPrevented(route.key)
  );
  const isHeaderBackButtonMenuEnabledOnPreventedScreen =
    preventedDescriptor?.options?.headerBackButtonMenuEnabled;
  const preventedRouteName = preventedDescriptor?.route?.name;

  React.useEffect(() => {
    if (preventedDescriptor != null && isHeaderBackButtonMenuEnabledOnPreventedScreen) {
      const message =
        `The screen ${preventedRouteName} uses 'usePreventRemove' hook alongside 'headerBackButtonMenuEnabled: true', which is not supported. \n\n` +
        `Consider removing 'headerBackButtonMenuEnabled: true' from ${preventedRouteName} screen to get rid of this error.`;
      console.error(message);
    }
  }, [preventedDescriptor, isHeaderBackButtonMenuEnabledOnPreventedScreen, preventedRouteName]);
}
