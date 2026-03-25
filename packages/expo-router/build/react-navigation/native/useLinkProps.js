"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLinkProps = useLinkProps;
const React = __importStar(require("react"));
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
    const root = React.useContext(core_1.NavigationContainerRefContext);
    const navigation = React.useContext(core_1.NavigationHelpersContext);
    const { options } = React.useContext(LinkingContext_1.LinkingContext);
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