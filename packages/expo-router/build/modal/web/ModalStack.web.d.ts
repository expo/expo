import { ParamListBase, StackNavigationState } from '@react-navigation/native';
import React from 'react';
import { ExtendedStackNavigationOptions } from '../../layouts/StackClient';
declare const RouterModal: React.ForwardRefExoticComponent<Omit<import("../..").PickPartial<any, "children">, "ref"> & React.RefAttributes<unknown>> & {
    Screen: (props: import("../..").ScreenProps<object, Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
        type: string;
        stale: false;
    }>, import("@react-navigation/native").EventMapBase>) => null;
    Protected: typeof import("../../views/Protected").Protected;
};
declare const RouterModalScreen: (props: import("../..").ScreenProps<object, Readonly<{
    key: string;
    index: number;
    routeNames: string[];
    history?: unknown[];
    routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
    type: string;
    stale: false;
}>, import("@react-navigation/native").EventMapBase>) => null;
export { RouterModal, RouterModalScreen };
/**
 * Returns a copy of the given Stack navigation state with any modal-type routes removed
 * (only when running on the web) and a recalculated `index` that still points at the
 * currently active non-modal route. If the active route *is* a modal that gets
 * filtered out, we fall back to the last remaining route – this matches the logic
 * used inside `ModalStackView` so that the underlying `NativeStackView` never tries
 * to render a modal screen that is simultaneously being shown in the overlay.
 *
 * This helper is exported primarily for unit-testing; it should be considered
 * internal to `ModalStack.web` and not a public API.
 *
 * @internal
 */
export declare function convertStackStateToNonModalState(state: StackNavigationState<ParamListBase>, descriptors: Record<string, {
    options: ExtendedStackNavigationOptions;
}>, isWeb: boolean): {
    routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
    index: number;
};
//# sourceMappingURL=ModalStack.web.d.ts.map