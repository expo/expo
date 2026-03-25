"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLinkProps = useLinkProps;
const react_1 = require("react");
const react_native_1 = require("react-native");
const core_1 = require("../core");
const LinkingContext_1 = require("./LinkingContext");
const getStateFromParams = (params) => {
    if (params?.state) {
        return params.state;
    }
    if (params?.screen) {
        return {
            routes: [
                {
                    name: params.screen,
                    params: params.params,
                    // @ts-expect-error this is fine 🔥
                    state: params.screen
                        ? getStateFromParams(params.params)
                        : undefined,
                },
            ],
        };
    }
    return undefined;
};
/**
 * Hook to get props for an anchor tag so it can work with in page navigation.
 *
 * @param props.screen Name of the screen to navigate to (e.g. `'Feeds'`).
 * @param props.params Params to pass to the screen to navigate to (e.g. `{ sort: 'hot' }`).
 * @param props.href Optional absolute path to use for the href (e.g. `/feeds/hot`).
 * @param props.action Optional action to use for in-page navigation. By default, the path is parsed to an action based on linking config.
 */
function useLinkProps({ screen, params, href, action, }) {
    const root = (0, react_1.use)(core_1.NavigationContainerRefContext);
    const navigation = (0, react_1.use)(core_1.NavigationHelpersContext);
    const { options } = (0, react_1.use)(LinkingContext_1.LinkingContext);
    const onPress = (e) => {
        let shouldHandle = false;
        if (react_native_1.Platform.OS !== 'web' || !e) {
            e?.preventDefault?.();
            shouldHandle = true;
        }
        else {
            // ignore clicks with modifier keys
            const hasModifierKey = ('metaKey' in e && e.metaKey) ||
                ('altKey' in e && e.altKey) ||
                ('ctrlKey' in e && e.ctrlKey) ||
                ('shiftKey' in e && e.shiftKey);
            // only handle left clicks
            const isLeftClick = 'button' in e ? e.button == null || e.button === 0 : true;
            // let browser handle "target=_blank" etc.
            const isSelfTarget = e.currentTarget && 'target' in e.currentTarget
                ? [undefined, null, '', 'self'].includes(e.currentTarget.target)
                : true;
            if (!hasModifierKey && isLeftClick && isSelfTarget) {
                e.preventDefault?.();
                shouldHandle = true;
            }
        }
        if (shouldHandle) {
            if (action) {
                if (navigation) {
                    navigation.dispatch(action);
                }
                else if (root) {
                    root.dispatch(action);
                }
                else {
                    throw new Error("Couldn't find a navigation object. Is your component inside NavigationContainer?");
                }
            }
            else {
                // @ts-expect-error This is already type-checked by the prop types
                navigation?.navigate(screen, params);
            }
        }
    };
    const getPathFromStateHelper = options?.getPathFromState ?? core_1.getPathFromState;
    return {
        href: href ??
            (react_native_1.Platform.OS === 'web' && screen != null
                ? getPathFromStateHelper({
                    routes: [
                        {
                            // @ts-expect-error this is fine 🔥
                            name: screen,
                            // @ts-expect-error this is fine 🔥
                            params,
                            // @ts-expect-error this is fine 🔥
                            state: getStateFromParams(params),
                        },
                    ],
                }, options?.config)
                : undefined),
        role: 'link',
        onPress,
    };
}
//# sourceMappingURL=useLinkProps.js.map