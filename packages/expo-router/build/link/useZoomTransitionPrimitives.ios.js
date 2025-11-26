"use strict";
'use client';
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
exports.useZoomTransitionPrimitives = useZoomTransitionPrimitives;
const non_secure_1 = require("nanoid/non-secure");
const react_1 = __importStar(require("react"));
const navigationParams_1 = require("../navigationParams");
const ZoomTransitionEnabler_1 = require("./ZoomTransitionEnabler");
const PreviewRouteContext_1 = require("./preview/PreviewRouteContext");
const native_1 = require("./preview/native");
const NOOP_COMPONENT = (props) => {
    return props.children;
};
function useZoomTransitionPrimitives({ unstable_transition, unstable_transitionAlignmentRect, href, }) {
    const isPreview = (0, PreviewRouteContext_1.useIsPreview)();
    const zoomTransitionId = (0, react_1.useMemo)(() => unstable_transition === 'zoom' &&
        !isPreview &&
        process.env.EXPO_OS === 'ios' &&
        (0, ZoomTransitionEnabler_1.isZoomTransitionEnabled)()
        ? (0, non_secure_1.nanoid)()
        : undefined, []);
    const ZoomTransitionWrapper = (0, react_1.useMemo)(() => {
        if (!zoomTransitionId) {
            return NOOP_COMPONENT;
        }
        return (props) => (<native_1.LinkZoomTransitionSource identifier={zoomTransitionId} alignment={unstable_transitionAlignmentRect}>
        {props.children}
      </native_1.LinkZoomTransitionSource>);
    }, [
        zoomTransitionId,
        unstable_transitionAlignmentRect?.x,
        unstable_transitionAlignmentRect?.y,
        unstable_transitionAlignmentRect?.width,
        unstable_transitionAlignmentRect?.height,
    ]);
    const computedHref = (0, react_1.useMemo)(() => {
        if (!zoomTransitionId) {
            return href;
        }
        if (typeof href === 'string') {
            return {
                pathname: href,
                params: {
                    [navigationParams_1.INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: zoomTransitionId,
                },
            };
        }
        return {
            pathname: href.pathname,
            params: {
                ...(href.params ?? {}),
                [navigationParams_1.INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: zoomTransitionId,
            },
        };
    }, [href, zoomTransitionId]);
    return { ZoomTransitionWrapper, href: computedHref };
}
//# sourceMappingURL=useZoomTransitionPrimitives.ios.js.map