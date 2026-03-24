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
exports.Header = void 0;
const React = __importStar(require("react"));
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const HeaderSegment_1 = require("./HeaderSegment");
const elements_1 = require("../../../elements");
const native_1 = require("../../../native");
const ModalPresentationContext_1 = require("../../utils/ModalPresentationContext");
const throttle_1 = require("../../utils/throttle");
exports.Header = React.memo(function Header({ back, layout, progress, options, route, navigation, styleInterpolator, }) {
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    let previousTitle;
    // The label for the left back button shows the title of the previous screen
    // If a custom label is specified, we use it, otherwise use previous screen's title
    if (options.headerBackTitle !== undefined) {
        previousTitle = options.headerBackTitle;
    }
    else if (back) {
        previousTitle = back.title;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const goBack = React.useCallback((0, throttle_1.throttle)(() => {
        if (navigation.isFocused() && navigation.canGoBack()) {
            navigation.dispatch({
                ...native_1.StackActions.pop(),
                source: route.key,
            });
        }
    }, 50), [navigation, route.key]);
    const isModal = React.useContext(ModalPresentationContext_1.ModalPresentationContext);
    const isParentHeaderShown = React.useContext(elements_1.HeaderShownContext);
    const statusBarHeight = options.headerStatusBarHeight !== undefined
        ? options.headerStatusBarHeight
        : isModal || isParentHeaderShown
            ? 0
            : insets.top;
    return (<HeaderSegment_1.HeaderSegment {...options} title={(0, elements_1.getHeaderTitle)(options, route.name)} progress={progress} layout={layout} modal={isModal} headerBackTitle={options.headerBackTitle !== undefined ? options.headerBackTitle : previousTitle} headerStatusBarHeight={statusBarHeight} onGoBack={back ? goBack : undefined} backHref={back ? back.href : undefined} styleInterpolator={styleInterpolator}/>);
});
//# sourceMappingURL=Header.js.map