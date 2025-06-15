import { type ParamListBase } from '@react-navigation/native';
import { RouteNode } from '../../Route';
import { Href, UnknownOutputParams } from '../../types';
export declare function HrefPreview({ href }: {
    href: Href;
}): import("react").JSX.Element | null;
export declare function getParamsAndNodeFromHref(href: Href): {
    params: UnknownOutputParams;
    routeNode: RouteNode | null | undefined;
    state: import("@react-navigation/native").PartialState<Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
        type: string;
        stale: false;
    }>> | undefined;
};
//# sourceMappingURL=HrefPreview.d.ts.map