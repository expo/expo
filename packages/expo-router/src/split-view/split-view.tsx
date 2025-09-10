import React, { use, useEffect, type ComponentProps } from 'react';

import type { SplitViewContextType, SplitViewProps } from './types';
// import { createNativeStackNavigator } from '../fork/native-stack/createNativeStackNavigator';
import Stack from '../layouts/StackClient';
import { withLayoutContext } from '../layouts/withLayoutContext';

export const SplitView = withLayoutContext(SplitViewNavigator, undefined);

function SplitViewNavigator({
  columnMetrics,
  disableSidebar,
  disableGestures,
  preferredDisplayMode,
  preferredSplitBehavior,
  showSecondaryToggleButton,
  ...stackProps
}: ComponentProps<typeof Stack> & SplitViewProps) {
  const { setOptions, options } = use(SplitViewContext);

  useEffect(() => {
    if (
      columnMetrics !== options.columnMetrics ||
      disableSidebar !== options.disableSidebar ||
      disableGestures !== options.disableGestures ||
      preferredDisplayMode !== options.preferredDisplayMode ||
      preferredSplitBehavior !== options.preferredSplitBehavior ||
      showSecondaryToggleButton !== options.showSecondaryToggleButton
    ) {
      setOptions({
        columnMetrics,
        disableSidebar,
        disableGestures,
        preferredDisplayMode,
        preferredSplitBehavior,
        showSecondaryToggleButton,
      });
    }
  }, [
    columnMetrics,
    disableSidebar,
    disableGestures,
    preferredDisplayMode,
    preferredSplitBehavior,
    showSecondaryToggleButton,
  ]);

  return <Stack {...stackProps} />;
}

export const SplitViewContext = React.createContext<SplitViewContextType>({
  options: {},
  setOptions: () => {},
});
