'use client';
import React from 'react';
import { withLayoutContext } from './withLayoutContext';
import { createStackNavigator, } from '../react-navigation/stack';
import { Protected } from '../views/Protected';
import { Screen } from '../views/Screen';
const JSStackNavigator = createStackNavigator().Navigator;
const JSStack = withLayoutContext(JSStackNavigator);
/**
 * Renders a JavaScript-based stack navigator.
 *
 * @hideType
 */
const Stack = Object.assign((props) => {
    return <JSStack {...props}/>;
}, {
    Screen,
    Protected,
});
export { Stack };
export default Stack;
//# sourceMappingURL=JSStack.js.map