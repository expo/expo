import './expect';
import { NavigationState, PartialState } from '@react-navigation/native';
import { render } from '@testing-library/react-native';
import { MockContextConfig, getMockConfig, getMockContext } from './mock-config';
export * from '@testing-library/react-native';
type RenderRouterOptions = Parameters<typeof render>[1] & {
    initialUrl?: any;
};
type Result = ReturnType<typeof render> & {
    getPathname(): string;
    getPathnameWithParams(): string;
    getSegments(): string[];
    getSearchParams(): Record<string, string | string[]>;
    getRouterState(): NavigationState<any> | PartialState<any>;
};
declare global {
    namespace jest {
        interface Matchers<R> {
            toHavePathname(pathname: string): R;
            toHavePathnameWithParams(pathname: string): R;
            toHaveSegments(segments: string[]): R;
            toHaveSearchParams(params: Record<string, string | string[]>): R;
            toHaveRouterState(state: NavigationState<any> | PartialState<any>): R;
        }
    }
}
export { MockContextConfig, getMockConfig, getMockContext };
export declare function renderRouter(context?: MockContextConfig, { initialUrl, ...options }?: RenderRouterOptions): Result;
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
    setParams(params?: Record<string, string>, path?: string): void;
    /** If there's history that supports invoking the `back` function. */
    dismissAll(): void;
};
//# sourceMappingURL=index.d.ts.map