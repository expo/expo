import type * as React from 'react';
/**
 * Higher order component to create a `Navigator` and `Screen` pair.
 * Custom navigators should wrap the navigator component in `createNavigator` before exporting.
 *
 * @param Navigator The navigator component. Should be wrapped with `withLayoutContext`.
 * @returns Factory method to create a `Navigator` and `Screen` pair.
 *
 * @deprecated This function may be replaced in the future version of expo-router.
 */
export declare function createNavigatorFactory(Navigator: React.ComponentType<any>): (config?: any) => any;
//# sourceMappingURL=createNavigatorFactory.d.ts.map