import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Split } from 'react-native-screens/experimental';

import { IsWithinNativeNavigator } from '../standard-navigation';
import { RouterSlot } from '../views/Navigator';
import type { SplitViewColumnProps } from './elements';
import type { SplitViewImplementationProps } from './split-view';

let hasWarnedAboutHeaderOptions = false;

function hasHeaderOptions({ children, ...headerOptions }: SplitViewColumnProps) {
  return Object.values(headerOptions).some((value) => value !== undefined);
}

export function RNSSplitView({
  columns,
  inspectors,
  screens,
  activityEnabled,
  screenOptions,
  ...hostProps
}: SplitViewImplementationProps) {
  if (
    process.env.NODE_ENV !== 'production' &&
    !hasWarnedAboutHeaderOptions &&
    (screenOptions || columns.some(hasHeaderOptions))
  ) {
    hasWarnedAboutHeaderOptions = true;
    console.warn(
      "SplitView header options are ignored by the react-native-screens implementation. Call setSplitViewImplementation('expo-ui') to use them."
    );
  }

  // The key is needed, because number of columns cannot be changed dynamically
  return (
    <IsWithinNativeNavigator value>
      <Split.Host key={columns.length + inspectors.length} {...hostProps}>
        {columns.map((column, index) => (
          <Split.Column key={index}>
            <SafeAreaProvider>{column.children}</SafeAreaProvider>
          </Split.Column>
        ))}
        <Split.Column>
          <RouterSlot activityEnabled={activityEnabled}>{screens}</RouterSlot>
        </Split.Column>
        {inspectors.map((inspector, index) => (
          <Split.Inspector key={index}>{inspector.children}</Split.Inspector>
        ))}
      </Split.Host>
    </IsWithinNativeNavigator>
  );
}
