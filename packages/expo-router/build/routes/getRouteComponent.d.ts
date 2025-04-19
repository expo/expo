import React from 'react';
import { RouteNode } from '../Route';
/** Wrap the component with various enhancements and add access to child routes. */
export declare function getQualifiedRouteComponent(value: RouteNode): React.ComponentType<any> | {
    ({ route, navigation, ...props }: any): React.JSX.Element;
    displayName: string;
};
//# sourceMappingURL=getRouteComponent.d.ts.map