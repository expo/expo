import * as React from 'react';
import { type UrlObject } from './routeInfo';
/**
 * Holds the route info for the path up to the current navigation level. Each level extends its
 * parent's route info with its own route (see `computeRouteInfo`) and provides the result to its
 * children, so route info is composed incrementally instead of by walking the whole state.
 */
export declare const RouteInfoContext: React.Context<UrlObject>;
//# sourceMappingURL=RouteInfoContext.d.ts.map