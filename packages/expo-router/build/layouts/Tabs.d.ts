import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import React from 'react';
import { ExpoRouter } from '../../types/expo-router';
type TabsProps = BottomTabNavigationOptions & {
    href?: ExpoRouter.Href | null;
};
export declare const Tabs: React.FC<TabsProps>;
export default Tabs;
//# sourceMappingURL=Tabs.d.ts.map