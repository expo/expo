import type { ComponentProps } from 'react';
import * as Screens from 'react-native-screens';
import * as ScreensExperimental from 'react-native-screens/experimental';

type NavigatorExports = Pick<typeof Screens & typeof ScreensExperimental, 'Stack' | 'Split'>;

// The installed types declare the navigators in experimental on v4 and in the main entry on v5.
const main = Screens as typeof Screens & Partial<NavigatorExports>;
const experimental = ScreensExperimental as typeof ScreensExperimental & NavigatorExports;

export const isScreens5 = main.Stack !== undefined;
export const StackV5: NavigatorExports['Stack'] = main.Stack ?? experimental.Stack;
export const Split: NavigatorExports['Split'] = main.Split ?? experimental.Split;
export type SplitHostProps = ComponentProps<typeof Split.Host>;
export { SafeAreaView } from 'react-native-screens/experimental';
