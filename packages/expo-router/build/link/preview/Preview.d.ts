import { RouteNode } from '../../Route';
import { Href, UnknownOutputParams } from '../../types';
export declare const PreviewParamsContext: import("react").Context<UnknownOutputParams | undefined>;
export declare function Preview({ href }: {
    href: Href;
}): import("react").JSX.Element | null;
export declare function getParamsAndNodeFromHref(href: Href): {
    params: UnknownOutputParams;
    routeNode: RouteNode | null | undefined;
};
//# sourceMappingURL=Preview.d.ts.map