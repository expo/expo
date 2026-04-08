import type { LinkToOptions } from './types';
import { SingularOptions } from '../useScreens';
export declare function getNavigateAction(baseHref: string, options: LinkToOptions, type?: string, withAnchor?: boolean, singular?: SingularOptions, isPreviewNavigation?: boolean): {
    type: string;
    target: string;
    payload: {
        name: any;
        params: Record<string, unknown> | undefined;
        singular: SingularOptions | undefined;
    };
} | undefined;
//# sourceMappingURL=getNavigationAction.d.ts.map