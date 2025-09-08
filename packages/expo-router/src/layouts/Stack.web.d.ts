import { ComponentProps } from 'react';
import { RouterModal } from '../modal/web/ModalStack';
declare const Stack: ((props: ComponentProps<typeof RouterModal>) => import("react").JSX.Element) & {
    Screen: (props: import("..").ScreenProps<object, Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("@react-navigation/routers").NavigationRoute<import("@react-navigation/routers").ParamListBase, string>[];
        type: string;
        stale: false;
    }>, import("@react-navigation/core").EventMapBase>) => null;
    Protected: import("react").FunctionComponent<import("../views/Protected").ProtectedProps>;
};
export { Stack };
export default Stack;
//# sourceMappingURL=Stack.web.d.ts.map