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
exports.CardContainer = void 0;
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const Card_1 = require("./Card");
const CardA11yWrapper_1 = require("./CardA11yWrapper");
const elements_1 = require("../../../elements");
const native_1 = require("../../../native");
const ModalPresentationContext_1 = require("../../utils/ModalPresentationContext");
const useKeyboardManager_1 = require("../../utils/useKeyboardManager");
const EPSILON = 0.1;
function CardContainerInner({ interpolationIndex, index, active, opening, closing, gesture, focused, modal, getPreviousScene, getFocusedRoute, hasAbsoluteFloatHeader, headerHeight, onHeaderHeightChange, isParentHeaderShown, isNextScreenTransparent, detachCurrentScreen, layout, onCloseRoute, onOpenRoute, onGestureCancel, onGestureEnd, onGestureStart, onTransitionEnd, onTransitionStart, preloaded, renderHeader, safeAreaInsetBottom, safeAreaInsetLeft, safeAreaInsetRight, safeAreaInsetTop, scene, }) {
    const wrapperRef = React.useRef(null);
    const { direction } = (0, native_1.useLocale)();
    const parentHeaderHeight = React.useContext(elements_1.HeaderHeightContext);
    const { options } = scene.descriptor;
    const enabled = focused && options.keyboardHandlingEnabled !== false;
    const { onPageChangeStart, onPageChangeCancel, onPageChangeConfirm } = (0, useKeyboardManager_1.useKeyboardManager)({
        enabled,
        focused,
    });
    const handleOpen = () => {
        const { route } = scene.descriptor;
        onTransitionEnd({ route }, false);
        onOpenRoute({ route });
    };
    const handleClose = () => {
        const { route } = scene.descriptor;
        onTransitionEnd({ route }, true);
        onCloseRoute({ route });
    };
    const handleGestureBegin = () => {
        const { route } = scene.descriptor;
        onPageChangeStart();
        onGestureStart({ route });
    };
    const handleGestureCanceled = () => {
        const { route } = scene.descriptor;
        onPageChangeCancel();
        onGestureCancel({ route });
    };
    const handleGestureEnd = () => {
        const { route } = scene.descriptor;
        onGestureEnd({ route });
    };
    const handleTransition = ({ closing, gesture }) => {
        wrapperRef.current?.setInert(closing);
        const { route } = scene.descriptor;
        onPageChangeConfirm?.({ gesture, active, closing });
        onTransitionStart?.({ route }, closing);
    };
    const insets = {
        top: safeAreaInsetTop,
        right: safeAreaInsetRight,
        bottom: safeAreaInsetBottom,
        left: safeAreaInsetLeft,
    };
    const { colors } = (0, native_1.useTheme)();
    React.useEffect(() => {
        const listener = scene.progress.next?.addListener?.(({ value }) => {
            wrapperRef.current?.setInert(value > EPSILON);
        });
        return () => {
            if (listener) {
                scene.progress.next?.removeListener?.(listener);
            }
        };
    }, [scene.progress.next]);
    const { presentation, animation, cardOverlay, cardOverlayEnabled, cardShadowEnabled, cardStyle, cardStyleInterpolator, gestureDirection, gestureEnabled, gestureResponseDistance, gestureVelocityImpact, headerMode, headerShown, transitionSpec, } = scene.descriptor.options;
    const { buildHref } = (0, native_1.useLinkBuilder)();
    const previousScene = getPreviousScene({ route: scene.descriptor.route });
    let backTitle;
    let href;
    if (previousScene) {
        const { options, route } = previousScene.descriptor;
        backTitle = (0, elements_1.getHeaderTitle)(options, route.name);
        href = buildHref(route.name, route.params);
    }
    const canGoBack = previousScene != null;
    const headerBack = React.useMemo(() => {
        if (canGoBack) {
            return {
                href,
                title: backTitle,
            };
        }
        return undefined;
    }, [canGoBack, backTitle, href]);
    const animated = animation !== 'none';
    return (<CardA11yWrapper_1.CardA11yWrapper ref={wrapperRef} focused={focused} active={active} animated={animated} isNextScreenTransparent={isNextScreenTransparent} detachCurrentScreen={detachCurrentScreen}>
      <Card_1.Card animated={animated} interpolationIndex={interpolationIndex} gestureDirection={gestureDirection} layout={layout} insets={insets} direction={direction} gesture={gesture} current={scene.progress.current} next={scene.progress.next} opening={opening} closing={closing} onOpen={handleOpen} onClose={handleClose} overlay={cardOverlay} overlayEnabled={cardOverlayEnabled} shadowEnabled={cardShadowEnabled} onTransition={handleTransition} onGestureBegin={handleGestureBegin} onGestureCanceled={handleGestureCanceled} onGestureEnd={handleGestureEnd} gestureEnabled={index === 0 ? false : gestureEnabled} gestureResponseDistance={gestureResponseDistance} gestureVelocityImpact={gestureVelocityImpact} transitionSpec={transitionSpec} styleInterpolator={cardStyleInterpolator} pageOverflowEnabled={headerMode !== 'float' && presentation !== 'modal'} preloaded={preloaded} containerStyle={hasAbsoluteFloatHeader && headerMode !== 'screen' ? { marginTop: headerHeight } : null} contentStyle={[
            {
                backgroundColor: presentation === 'transparentModal' ? 'transparent' : colors.background,
            },
            cardStyle,
        ]}>
        <react_native_1.View style={styles.container}>
          <ModalPresentationContext_1.ModalPresentationContext.Provider value={modal}>
            {headerMode !== 'float'
            ? renderHeader({
                mode: 'screen',
                layout,
                scenes: [previousScene, scene],
                getPreviousScene,
                getFocusedRoute,
                onContentHeightChange: onHeaderHeightChange,
                style: styles.header,
            })
            : null}
            <react_native_1.View style={styles.scene}>
              <elements_1.HeaderBackContext.Provider value={headerBack}>
                <elements_1.HeaderShownContext.Provider value={isParentHeaderShown || headerShown !== false}>
                  <elements_1.HeaderHeightContext.Provider value={headerShown !== false ? headerHeight : (parentHeaderHeight ?? 0)}>
                    {scene.descriptor.render()}
                  </elements_1.HeaderHeightContext.Provider>
                </elements_1.HeaderShownContext.Provider>
              </elements_1.HeaderBackContext.Provider>
            </react_native_1.View>
          </ModalPresentationContext_1.ModalPresentationContext.Provider>
        </react_native_1.View>
      </Card_1.Card>
    </CardA11yWrapper_1.CardA11yWrapper>);
}
exports.CardContainer = React.memo(CardContainerInner);
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        zIndex: 1,
    },
    scene: {
        flex: 1,
    },
});
//# sourceMappingURL=CardContainer.js.map