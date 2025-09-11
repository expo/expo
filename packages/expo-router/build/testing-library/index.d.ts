import './expect';
import './mocks';
import React from 'react';
import { MockContextConfig, getMockConfig, getMockContext } from './mock-config';
import { ExpoLinkingOptions } from '../getLinkingConfig';
import { ReactNavigationState } from '../global-state/router-store';
declare const rnTestingLibrary: typeof import("@testing-library/react-native");
export type * from '@testing-library/react-native';
export declare const act: typeof React.act, cleanup: typeof import("@testing-library/react-native").cleanup, fireEvent: typeof import("@testing-library/react-native").fireEvent, waitFor: typeof import("@testing-library/react-native").waitFor, waitForElementToBeRemoved: typeof import("@testing-library/react-native").waitForElementToBeRemoved, within: typeof import("@testing-library/react-native").within, configure: typeof import("@testing-library/react-native").configure, resetToDefaults: typeof import("@testing-library/react-native").resetToDefaults, isHiddenFromAccessibility: typeof import("@testing-library/react-native").isHiddenFromAccessibility, isInaccessible: typeof import("@testing-library/react-native").isHiddenFromAccessibility, getDefaultNormalizer: typeof import("@testing-library/react-native").getDefaultNormalizer, renderHook: typeof import("@testing-library/react-native").renderHook, userEvent: {
    setup: typeof import("@testing-library/react-native/build/user-event/setup").setup;
    press: (element: import("react-test-renderer").ReactTestInstance) => Promise<void>;
    longPress: (element: import("react-test-renderer").ReactTestInstance, options?: import("@testing-library/react-native/build/user-event/press").PressOptions) => Promise<void>;
    type: (element: import("react-test-renderer").ReactTestInstance, text: string, options?: import("@testing-library/react-native/build/user-event/type").TypeOptions) => Promise<void>;
    clear: (element: import("react-test-renderer").ReactTestInstance) => Promise<void>;
    paste: (element: import("react-test-renderer").ReactTestInstance, text: string) => Promise<void>;
    scrollTo: (element: import("react-test-renderer").ReactTestInstance, options: import("@testing-library/react-native/build/user-event/scroll").ScrollToOptions) => Promise<void>;
};
export declare let screen: typeof rnTestingLibrary.screen;
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