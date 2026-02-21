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
exports.usePreviewTransition = usePreviewTransition;
const React = __importStar(require("react"));
const LinkPreviewContext_1 = require("../../link/preview/LinkPreviewContext");
/**
 * Manages the preview transition state for link previews.
 *
 * Tracks when a preloaded screen is transitioning on the native side (after
 * the preview is committed) but before React Navigation state is updated.
 * During this window, the hook synthesizes state/descriptors to keep native
 * and JS state in sync.
 */
function usePreviewTransition(state, navigation, descriptors, describe) {
    const { openPreviewKey, setOpenPreviewKey } = (0, LinkPreviewContext_1.useLinkPreviewContext)();
    // Track the preview screen currently transitioning on the native side
    const [previewTransitioningScreenId, setPreviewTransitioningScreenId] = React.useState();
    React.useEffect(() => {
        if (previewTransitioningScreenId) {
            // State was updated after the preview transition
            if (state.routes.some((route) => route.key === previewTransitioningScreenId)) {
                // No longer need to track the preview transitioning screen
                setPreviewTransitioningScreenId(undefined);
            }
        }
    }, [state, previewTransitioningScreenId]);
    const navigationWrapper = React.useMemo(() => {
        if (openPreviewKey) {
            const emit = (...args) => {
                const { target, type, data } = args[0];
                if (target === openPreviewKey && data && 'closing' in data && !data.closing) {
                    // onWillAppear
                    if (type === 'transitionStart') {
                        // The screen from preview will appear, so we need to start tracking it
                        setPreviewTransitioningScreenId(openPreviewKey);
                    }
                    // onAppear
                    else if (type === 'transitionEnd') {
                        // The screen from preview appeared.
                        // We can now restore the stack animation
                        setOpenPreviewKey(undefined);
                    }
                }
                return navigation.emit(...args);
            };
            return {
                ...navigation,
                emit,
            };
        }
        return navigation;
    }, [navigation, openPreviewKey, setOpenPreviewKey]);
    const { computedState, computedDescriptors } = React.useMemo(() => {
        // The preview screen was pushed on the native side, but react-navigation state was not updated yet
        if (previewTransitioningScreenId) {
            const preloadedRoute = state.preloadedRoutes.find((route) => route.key === previewTransitioningScreenId);
            if (preloadedRoute) {
                const newState = {
                    ...state,
                    // On native side the screen is already pushed, so we need to update the state
                    preloadedRoutes: state.preloadedRoutes.filter((route) => route.key !== previewTransitioningScreenId),
                    routes: [...state.routes, preloadedRoute],
                    index: state.index + 1,
                };
                const newDescriptors = previewTransitioningScreenId in descriptors
                    ? descriptors
                    : {
                        ...descriptors,
                        // We need to add the descriptor. For react-navigation this is still preloaded screen
                        // Replicating the logic from https://github.com/react-navigation/react-navigation/blob/eaf1100ac7d99cb93ba11a999549dd0752809a78/packages/native-stack/src/views/NativeStackView.native.tsx#L489
                        [previewTransitioningScreenId]: describe(preloadedRoute, true),
                    };
                return {
                    computedState: newState,
                    computedDescriptors: newDescriptors,
                };
            }
        }
        return {
            computedState: state,
            computedDescriptors: descriptors,
        };
    }, [state, previewTransitioningScreenId, describe, descriptors]);
    return { computedState, computedDescriptors, navigationWrapper };
}
//# sourceMappingURL=usePreviewTransition.js.map