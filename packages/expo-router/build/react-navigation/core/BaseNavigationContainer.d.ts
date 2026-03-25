import * as React from 'react';
import { type ParamListBase } from '../routers';
import type { NavigationContainerProps, NavigationContainerRef } from './types';
/**
 * Container component which holds the navigation state.
 * This should be rendered at the root wrapping the whole app.
 *
 * @param props.initialState Initial state object for the navigation tree.
 * @param props.onReady Callback which is called after the navigation tree mounts.
 * @param props.onStateChange Callback which is called with the latest navigation state when it changes.
 * @param props.onUnhandledAction Callback which is called when an action is not handled.
 * @param props.theme Theme object for the UI elements.
 * @param props.children Child elements to render the content.
 * @param props.ref Ref object which refers to the navigation object containing helper methods.
 */
export declare const BaseNavigationContainer: React.ForwardRefExoticComponent<NavigationContainerProps & React.RefAttributes<NavigationContainerRef<ParamListBase>>>;
//# sourceMappingURL=BaseNavigationContainer.d.ts.map