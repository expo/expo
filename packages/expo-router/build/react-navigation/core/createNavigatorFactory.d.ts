import type * as React from 'react';
/**
 * Higher order component to create a `Navigator` and `Screen` pair.
 * Custom navigators should wrap the navigator component in `createNavigator` before exporting.
 *
 * @param Navigator The navigator component to wrap.
 * @returns Factory method to create a `Navigator` and `Screen` pair.
 */
export declare function createNavigatorFactory(Navigator: React.ComponentType<any>): (config?: any) => any;
//# sourceMappingURL=createNavigatorFactory.d.ts.map