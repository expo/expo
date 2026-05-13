import Stack from './StackClient';
import { StackScreen, StackHeader, StackTitle } from './stack-utils';
// Note(@ubax): Importing StackToolbar from separate file for rsc to work correctly
import { StackToolbar } from './stack-utils/toolbar/StackToolbar';

Stack.Screen = StackScreen;
Stack.Header = StackHeader;
Stack.Title = StackTitle;
Stack.Toolbar = StackToolbar;

export { Stack };

export default Stack;
