import { type BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { type ParamListBase } from '@react-navigation/native';
import Tabs from './TabsClient';
export type TabNavigationProp<ParamList extends ParamListBase = ParamListBase, RouteName extends keyof ParamList = keyof ParamList, NavigatorID extends string | undefined = undefined> = BottomTabNavigationProp<ParamList, RouteName, NavigatorID>;
export { Tabs };
export default Tabs;
//# sourceMappingURL=Tabs.d.ts.map