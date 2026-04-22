'use client';
import React from 'react';
import { withLayoutContext } from './withLayoutContext';
import { createMaterialTopTabNavigator, } from '../react-navigation/material-top-tabs';
import { Protected } from '../views/Protected';
import { Screen } from '../views/Screen';
const MaterialTopTabNavigator = createMaterialTopTabNavigator().Navigator;
const MaterialTopTabs = withLayoutContext(MaterialTopTabNavigator);
/**
 * Renders a material top tab navigator.
 *
 * @hideType
 */
const TopTabs = Object.assign((props) => {
    return <MaterialTopTabs {...props}/>;
}, {
    Screen,
    Protected,
});
export { TopTabs };
export default TopTabs;
//# sourceMappingURL=TopTabsClient.js.map