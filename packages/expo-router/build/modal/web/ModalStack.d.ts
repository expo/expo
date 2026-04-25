import React from 'react';
import type { ParamListBase } from '../../react-navigation/native';
declare const RouterModal: React.ForwardRefExoticComponent<Omit<import("../..").PickPartial<any, "children">, "ref"> & React.RefAttributes<unknown>> & {
    Screen: (props: import("../..").ScreenProps<object, Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("../../react-navigation/core").NavigationRoute<ParamListBase, string>[];
        type: string;
        stale: false;
    }>, import("../..").EventMapBase>) => null;
    Protected: typeof import("../../views/Protected").Protected;
};
declare const RouterModalScreen: (props: import("../..").ScreenProps<object, Readonly<{
    key: string;
    index: number;
    routeNames: string[];
    history?: unknown[];
    routes: import("../../react-navigation/core").NavigationRoute<ParamListBase, string>[];
    type: string;
    stale: false;
}>, import("../..").EventMapBase>) => null;
export { RouterModal, RouterModalScreen };
//# sourceMappingURL=ModalStack.d.ts.map