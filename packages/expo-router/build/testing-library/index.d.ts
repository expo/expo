import './expect';
import './mocks';
import { MockContextConfig, getMockConfig, getMockContext } from './mock-config';
import { ExpoLinkingOptions } from '../getLinkingConfig';
import { ReactNavigationState } from '../global-state/router-store';
declare const rnTestingLibrary: typeof import("@testing-library/react-native");
export type * from '@testing-library/react-native';
export type RenderRouterOptions = Parameters<typeof rnTestingLibrary.render>[1] & {
    initialUrl?: any;
    linking?: Partial<ExpoLinkingOptions>;
};
type Result = ReturnType<typeof rnTestingLibrary.render> & {
    getPathname(): string;
    getPathnameWithParams(): string;
    getSegments(): string[];
    getSearchParams(): Record<string, string | string[]>;
    getRouterState(): ReactNavigationState | undefined;
};
export { MockContextConfig, getMockConfig, getMockContext };
export declare function renderRouter(context?: MockContextConfig, { initialUrl, linking, ...options }?: RenderRouterOptions): Result;
export declare const testRouter: {
    /** Navigate to the provided pathname and the pathname */
    navigate(path: string): void;
    /** Push the provided pathname and assert the pathname */
    push(path: string): void;
    /** Replace with provided pathname and assert the pathname */
    replace(path: string): void;
    /** Go back in history and asset the new pathname */
    back(path?: string): void;
    /** If there's history that supports invoking the `back` function. */
    canGoBack(): boolean;
    /** Update the current route query params and assert the new pathname */
    setParams(params: Record<string, string>, path?: string): void;
    /** If there's history that supports invoking the `back` function. */
    dismissAll(): void;
};
//# sourceMappingURL=index.d.ts.map