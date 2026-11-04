import type { ComponentType, ReactNode } from 'react';
import * as Screens from 'react-native-screens';
import * as ScreensExperimental from 'react-native-screens/experimental';

type ScreensV5Exports = Pick<typeof ScreensExperimental, 'Stack' | 'Split'>;

// react-native-screens 5 exports `Stack` and `Split` from the main entry, 4.x only from
// `experimental`. Our types target 4.x, where the main entry doesn't declare them, hence the cast.
const screensV5 = Screens as unknown as Partial<ScreensV5Exports>;

export const StackV5 = screensV5.Stack ?? ScreensExperimental.Stack;
// react-native-screens 5 adds column stacks and header configs to `Split`. 4.x doesn't have them.
type SplitV5Components = {
  Stack?: ComponentType<{ children?: ReactNode }>;
  HeaderConfig?: ComponentType<object>;
};
export const Split: typeof ScreensExperimental.Split & SplitV5Components =
  screensV5.Split ?? ScreensExperimental.Split;
// react-native-screens 4.x and 5 export `SafeAreaView` only from `experimental`.
export {
  SafeAreaView,
  type SplitHostCommands,
  type SplitHostProps,
} from 'react-native-screens/experimental';
