import * as Screens from 'react-native-screens';
import * as ScreensExperimental from 'react-native-screens/experimental';

type ScreensV5Exports = Pick<typeof ScreensExperimental, 'Stack' | 'Split'>;

// react-native-screens 5 exports `Stack` and `Split` from the main entry, 4.x only from
// `experimental`. Our types target 4.x, where the main entry doesn't declare them, hence the cast.
const screensV5 = Screens as unknown as Partial<ScreensV5Exports>;

export const StackV5 = screensV5.Stack ?? ScreensExperimental.Stack;
export const Split = screensV5.Split ?? ScreensExperimental.Split;
export type { SplitHostProps } from 'react-native-screens/experimental';
