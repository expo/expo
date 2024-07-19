import { TabRouterOptions, ParamListBase, TabNavigationState, TabActionType, CommonNavigationAction, Router } from '@react-navigation/native';
export type ExpoTabNavigationState = Omit<TabNavigationState<ParamListBase>, 'type'> & {
    type: 'expo-tab';
};
export type ExpoTabRouter = Router<ExpoTabNavigationState, TabActionType | CommonNavigationAction>;
export type ExpoTabRouterOptions = TabRouterOptions & {
    key: string;
};
export declare function TabRouter(routerOptions: ExpoTabRouterOptions): ExpoTabRouter;
//# sourceMappingURL=Tabs.router.d.ts.map