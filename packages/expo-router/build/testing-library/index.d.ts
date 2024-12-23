import './expect';
import './mocks';
import { NavigationState, PartialState } from '@react-navigation/native';
import { render } from '@testing-library/react-native';
import { MockContextConfig, getMockConfig, getMockContext } from './mock-config';
import { ExpoLinkingOptions } from '../getLinkingConfig';
export * from '@testing-library/react-native';
export type RenderRouterOptions = Parameters<typeof render>[1] & {
    initialUrl?: any;
    linking?: Partial<ExpoLinkingOptions>;
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
export declare function renderRouter(context?: MockContextConfig, { initialUrl, linking, ...options }?: RenderRouterOptions): Result;
//# sourceMappingURL=index.d.ts.map