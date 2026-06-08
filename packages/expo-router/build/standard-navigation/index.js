"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.unstable_createStandardRouterNavigator = unstable_createStandardRouterNavigator;
exports.unstable_integrateWithRouter = unstable_integrateWithRouter;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const standard_navigation_1 = require("standard-navigation");
const useProjectedDescriptors_1 = require("./useProjectedDescriptors");
const useStandardActions_1 = require("./useStandardActions");
const useStandardEmitter_1 = require("./useStandardEmitter");
const useStandardState_1 = require("./useStandardState");
const withLayoutContext_1 = require("../layouts/withLayoutContext");
const native_1 = require("../react-navigation/native");
const SUPPORTED_VERSION = 1;
const STANDARD_NAVIGATOR_TYPE = 'standard';
/**
 * > **warning** This API is unstable and may change between minor releases.
 *
 * Creates a [`standard-navigation`](https://www.npmjs.com/package/standard-navigation) navigator and
 * wires it into Expo Router in one step. Use `unstable_integrateWithRouter` instead if you already
 * have a navigator from `createStandardNavigator`.
 *
 * @param NavigatorContent Renders the navigator UI; receives the standard-navigation `state`,
 * `descriptors`, `actions`, and `emitter`.
 * @param router The router factory to use. For example, `StackRouter` or `TabRouter`.
 * @param options See `IntegrateWithRouterOptions`.
 *
 * @example
 * ```tsx
 * import { unstable_createStandardRouterNavigator, TabRouter } from 'expo-router';
 *
 * export const Tabs = unstable_createStandardRouterNavigator(MyTabsContent, TabRouter);
 * ```
 */
function unstable_createStandardRouterNavigator(NavigatorContent, router, options) {
    const navigator = (0, standard_navigation_1.createStandardNavigator)(NavigatorContent);
    return unstable_integrateWithRouter(navigator, router, options);
}
/**
 * > **warning** This API is unstable and may change between minor releases.
 *
 * Wires an existing [`standard-navigation`](https://www.npmjs.com/package/standard-navigation)
 * navigator into Expo Router, returning a navigator component (with a `.Screen` child) usable as a
 * layout. Use `unstable_createStandardRouterNavigator` to create and integrate in one step.
 *
 * @param navigator The object returned by `createStandardNavigator(...)`.
 * @param router The router factory to use. For example, `StackRouter` or `TabRouter`.
 * @param options See `IntegrateWithRouterOptions`.
 *
 * @example
 * ```tsx
 * import { createStandardNavigator } from 'standard-navigation';
 * import { unstable_integrateWithRouter, TabRouter } from 'expo-router';
 *
 * const navigator = createStandardNavigator(MyTabsContent);
 * export const Tabs = unstable_integrateWithRouter(navigator, TabRouter);
 * ```
 */
function unstable_integrateWithRouter(navigator, router, options) {
    assertStandardNavigator(navigator);
    const { NavigatorContent } = navigator;
    function StandardRouterNavigator(props) {
        const { extraProps, useNavigationBuilderProps } = partitionNavigatorProps(props);
        const { state, navigation, descriptors, describe, NavigationContent } = (0, native_1.useNavigationBuilder)(router, useNavigationBuilderProps);
        const { dispatch } = navigation;
        const derivedProps = (0, react_1.useMemo)(() => options?.createProps?.({ state, dispatch, navigation }) ?? {}, [state, dispatch, navigation, options]);
        const standardArgs = {
            state: (0, useStandardState_1.useStandardState)(state),
            descriptors: (0, useProjectedDescriptors_1.useProjectedDescriptors)(state, descriptors, describe),
            actions: (0, useStandardActions_1.useStandardActions)(navigation, state.key),
            emitter: (0, useStandardEmitter_1.useStandardEmitter)(navigation),
        };
        return ((0, jsx_runtime_1.jsx)(NavigationContent, { children: (0, jsx_runtime_1.jsx)(NavigatorContent
            // `extraProps` is everything that is not a `useNavigationBuilder` option, which is the
            // navigator props *and* the router options merged together — at runtime there is no way
            // to tell the two apart, so the router options are intentionally forwarded here as well.
            // This is benign: `StandardNavigatorContentProps` only surfaces the navigator props in
            // its type, so the TS contract keeps users from reading router options off `NavigatorContent`
            // in the common case, even though they are physically present on the object.
            , { ...extraProps, ...derivedProps, ...standardArgs }) }));
    }
    return (0, withLayoutContext_1.withLayoutContext)(StandardRouterNavigator, undefined, options?.useOnlyUserDefinedScreens);
}
/**
 * Partitions a navigator's props into the subset consumed by `useNavigationBuilder`
 * (`useNavigationBuilderProps`) and everything else (`extraProps`, forwarded to `NavigatorContent`).
 */
function partitionNavigatorProps(props) {
    const { id, children, initialRouteName, layout, 
    // `ref` is supplied by `withLayoutContext` and consumed by React; it must not be forwarded
    // to `NavigatorContent`, so it is pulled out of the props here and intentionally dropped.
    ref, screenLayout, screenListeners, screenOptions, UNSTABLE_routeNamesChangeBehavior, UNSTABLE_router, ...extraProps } = props;
    // The builder-specific keys are explicitly destructured so they cannot leak into `extraProps`.
    // Re-listing them as a pure object literal typed as `StandardUseNavigationBuilderOptions` also makes
    // the partition type-checked: a key that is not a valid builder option is rejected by excess-property
    // checking, and a missing required builder option is rejected too — both surface as a compile error
    // here instead of silently passing through to the wrong consumer.
    const useNavigationBuilderProps = {
        id,
        children,
        initialRouteName,
        layout,
        screenLayout,
        screenListeners,
        screenOptions,
        UNSTABLE_routeNamesChangeBehavior,
        UNSTABLE_router,
    };
    return {
        extraProps,
        // Spread `extraProps` first so router-specific options (e.g. `backBehavior`) reach the
        // router, then the framework keys above. `NavigatorContent` still receives `extraProps`.
        useNavigationBuilderProps: {
            ...extraProps,
            ...useNavigationBuilderProps,
        },
    };
}
function assertStandardNavigator(navigator) {
    if (navigator == null) {
        throw new Error('Could not integrate a standard navigator because no navigator was provided. ' +
            'Pass the object returned by `createStandardNavigator(...)` from the `standard-navigation` package, ' +
            'or use `unstable_createStandardRouterNavigator(NavigatorContent, router)` which creates it for you.');
    }
    const { type, version } = navigator;
    if (type !== STANDARD_NAVIGATOR_TYPE) {
        throw new Error(`Could not integrate a standard navigator because its \`type\` is ${JSON.stringify(type)}, not "standard". ` +
            'This value is likely not a standard-navigation navigator. ' +
            'Create it with `createStandardNavigator(...)` from the `standard-navigation` package, ' +
            'or use `unstable_createStandardRouterNavigator(NavigatorContent, router)`.');
    }
    if (version !== SUPPORTED_VERSION) {
        // This is a warning rather than a hard error on purpose: the standard-navigation contract is
        // versioned by the `standard-navigation` package, not by expo-router, and integration is likely
        // to keep working across adjacent versions. Blocking here would needlessly break those cases.
        // If a mismatch does cause problems, this points at the version skew as the likely cause.
        console.warn(`This standard navigator targets the standard-navigation v${version} contract, ` +
            `but this version of expo-router was built against v${SUPPORTED_VERSION}. ` +
            'Integration may still work, but if you hit unexpected navigation behavior, ' +
            'align the installed `standard-navigation` version with your expo-router version, ' +
            'or check the standard-navigation release notes for migration steps.');
    }
}
//# sourceMappingURL=index.js.map