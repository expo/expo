"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterModal = void 0;
const native_1 = require("@react-navigation/native");
const native_stack_1 = require("@react-navigation/native-stack");
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const vaul_1 = require("vaul");
const withLayoutContext_1 = require("./withLayoutContext");
const modal_module_css_1 = __importDefault(require("../../assets/modal.module.css"));
function ModalStackNavigator({ initialRouteName, children, screenOptions }) {
    const { state, navigation, descriptors, NavigationContent, describe } = (0, native_1.useNavigationBuilder)(native_1.StackRouter, {
        children,
        screenOptions,
        initialRouteName,
    });
    return (<NavigationContent>
      <ModalStackView state={state} navigation={navigation} descriptors={descriptors} describe={describe}/>
    </NavigationContent>);
}
function ModalStackView({ state, navigation, descriptors, describe, }) {
    const isWeb = react_native_1.Platform.OS === 'web';
    const { colors } = (0, native_1.useTheme)();
    const nonModalRoutes = state.routes.filter((route) => {
        const { presentation } = descriptors[route.key].options || {};
        const isModalType = presentation === 'modal' ||
            presentation === 'formSheet' ||
            presentation === 'fullScreenModal' ||
            presentation === 'containedModal';
        return !(isWeb && isModalType);
    });
    let nonModalIndex = nonModalRoutes.findIndex((r) => r.key === state.routes[state.index]?.key);
    if (nonModalIndex < 0)
        nonModalIndex = nonModalRoutes.length - 1;
    const newStackState = { ...state, routes: nonModalRoutes, index: nonModalIndex };
    return (<div style={{ flex: 1, display: 'flex' }}>
      <native_stack_1.NativeStackView state={newStackState} navigation={navigation} descriptors={descriptors} describe={describe}/>
      {isWeb &&
            state.routes.map((route, i) => {
                const { presentation } = descriptors[route.key].options || {};
                const isModalType = presentation === 'modal' ||
                    presentation === 'formSheet' ||
                    presentation === 'fullScreenModal' ||
                    presentation === 'containedModal';
                const isActive = i === state.index && isModalType;
                if (!isActive)
                    return null;
                return (<RouteDrawer key={route.key} routeKey={route.key} options={descriptors[route.key].options} renderScreen={descriptors[route.key].render} onDismiss={() => navigation.goBack()} themeColors={colors}/>);
            })}
    </div>);
}
const createModalStack = (0, native_1.createNavigatorFactory)(ModalStackNavigator);
const RouterModal = (0, withLayoutContext_1.withLayoutContext)(createModalStack().Navigator);
exports.RouterModal = RouterModal;
// Internal helper component
function RouteDrawer({ routeKey, options, renderScreen, onDismiss, themeColors, }) {
    const [open, setOpen] = react_1.default.useState(true);
    // Determine layout based on viewport width (desktop vs mobile)
    const isDesktop = useIsDesktop();
    const isSheet = !isDesktop;
    // Resolve snap points logic.
    const allowed = options.sheetAllowedDetents;
    const isArrayDetents = Array.isArray(allowed);
    const useCustomSnapPoints = isArrayDetents && !(allowed.length === 1 && allowed[0] === 1);
    let snapPoints = useCustomSnapPoints
        ? allowed
        : undefined;
    if (!isSheet) {
        snapPoints = [1];
    }
    const [snap, setSnap] = react_1.default.useState(useCustomSnapPoints && isArrayDetents ? allowed[0] : 1);
    // When the viewport flips between desktop <-> mobile, update snap value accordingly.
    react_1.default.useEffect(() => {
        if (isSheet) {
            const next = useCustomSnapPoints && isArrayDetents ? allowed[0] : 1;
            setSnap(next);
        }
        else {
            // Desktop modal always fixed snap at 1
            setSnap(1);
        }
    }, [isSheet]);
    // Map react-native-screens ios sheet undimmed logic to Vaul's fadeFromIndex
    const fadeFromIndex = isSheet
        ? options.sheetLargestUndimmedDetentIndex === 'last'
            ? (snapPoints?.length ?? 0)
            : typeof options.sheetLargestUndimmedDetentIndex === 'number'
                ? options.sheetLargestUndimmedDetentIndex + 1
                : 0
        : 0;
    // --- Styling -----------------------------------------------------------
    // Using CSS variables so defaults live in CSS and can be overridden via props.
    const modalStyleVars = {
        backgroundColor: themeColors.background,
    };
    if (!isSheet) {
        if (options.modalWidth) {
            modalStyleVars['--expo-router-modal-width'] =
                typeof options.modalWidth === 'number' ? `${options.modalWidth}px` : options.modalWidth;
            modalStyleVars['--expo-router-modal-max-width'] =
                typeof options.modalWidth === 'number' ? `${options.modalWidth}px` : options.modalWidth;
            // Also set explicit width so browsers that ignore CSS vars in `width` prop still work.
            modalStyleVars.width =
                typeof options.modalWidth === 'number' ? `${options.modalWidth}px` : options.modalWidth;
        }
        // Min width override
        if (options.modalMinWidth) {
            const mw = typeof options.modalMinWidth === 'number'
                ? `${options.modalMinWidth}px`
                : options.modalMinWidth;
            modalStyleVars['--expo-router-modal-min-width'] = mw;
            modalStyleVars.minWidth = mw;
        }
        if (options.modalHeight) {
            const h = typeof options.modalHeight === 'number' ? `${options.modalHeight}px` : options.modalHeight;
            modalStyleVars['--expo-router-modal-height'] = h;
            modalStyleVars.maxHeight = h;
            modalStyleVars.height = h;
            modalStyleVars.minHeight = h;
        }
        // Separate min-height override (takes precedence over modalHeight)
        if (options.modalMinHeight) {
            const mh = typeof options.modalMinHeight === 'number'
                ? `${options.modalMinHeight}px`
                : options.modalMinHeight;
            modalStyleVars['--expo-router-modal-min-height'] = mh;
            modalStyleVars.minHeight = mh;
        }
    }
    const fitToContents = isSheet && options.sheetAllowedDetents === 'fitToContents';
    if (fitToContents) {
        modalStyleVars.height = 'auto';
        modalStyleVars.minHeight = 'auto';
        // Allow sheet to grow with content but never exceed viewport height
        modalStyleVars.maxHeight = 'calc(100vh)';
    }
    // Apply corner radius (default 10px)
    const radiusValue = options.sheetCornerRadius ?? 10;
    const radiusCss = typeof radiusValue === 'number' ? `${radiusValue}px` : radiusValue;
    if (options.modalBorder) {
        modalStyleVars['--expo-router-modal-border'] = options.modalBorder;
    }
    if (isSheet) {
        // Only top corners for mobile sheet
        modalStyleVars.borderTopLeftRadius = radiusCss;
        modalStyleVars.borderTopRightRadius = radiusCss;
        // Only apply CSS var override if a custom corner radius was provided
        if (options.sheetCornerRadius) {
            modalStyleVars['--expo-router-modal-radius'] = radiusCss;
        }
    }
    else {
        // All corners for desktop modal
        if (options.sheetCornerRadius) {
            modalStyleVars.borderRadius = radiusCss;
            modalStyleVars['--expo-router-modal-radius'] = radiusCss;
        }
    }
    // --- End Styling -----------------------------------------------------------
    const handleOpenChange = (open) => {
        if (!open)
            onDismiss();
    };
    // Props that only make sense for sheets
    const sheetProps = isSheet
        ? {
            snapPoints: snapPoints,
            activeSnapPoint: snap,
            setActiveSnapPoint: setSnap,
            fadeFromIndex,
        }
        : {};
    return (<vaul_1.Drawer.Root key={`${routeKey}-${isSheet ? 'sheet' : 'modal'}`} open={open} dismissible={options.gestureEnabled ?? true} onAnimationEnd={handleOpenChange} onOpenChange={setOpen} {...sheetProps}>
      <vaul_1.Drawer.Portal>
        <vaul_1.Drawer.Overlay className={modal_module_css_1.default.overlay} style={options.modalOverlayBackground
            ? {
                '--expo-router-modal-overlay-bg': options.modalOverlayBackground,
            }
            : undefined}/>
        <vaul_1.Drawer.Content aria-describedby="modal-description" className={modal_module_css_1.default.drawerContent} style={{
            pointerEvents: 'none',
            ...(fitToContents ? { height: 'auto' } : null),
        }}>
          <div className={modal_module_css_1.default.modal} data-presentation={isSheet ? 'formSheet' : 'modal'} style={modalStyleVars}>
            {/* Figure out how to add title and description to the modal for screen readers */}
            <vaul_1.Drawer.Title about="" aria-describedby="" className={modal_module_css_1.default.srOnly}/>
            <vaul_1.Drawer.Description about="" className={modal_module_css_1.default.srOnly}/>
            {/* Render the screen content */}
            <div className={modal_module_css_1.default.modalBody}>{renderScreen()}</div>
          </div>
        </vaul_1.Drawer.Content>
      </vaul_1.Drawer.Portal>
    </vaul_1.Drawer.Root>);
}
/**
 * Hook that returns `true` when the viewport width is considered desktop-sized.
 * The default breakpoint is 1024 px (iPad landscape and larger).
 */
function useIsDesktop(breakpoint = 768) {
    const isWeb = react_native_1.Platform.OS === 'web';
    const [isDesktop, setIsDesktop] = react_1.default.useState(() => {
        if (!isWeb || typeof window === 'undefined')
            return false;
        return window.matchMedia(`(min-width: ${breakpoint}px)`).matches;
    });
    react_1.default.useEffect(() => {
        if (!isWeb || typeof window === 'undefined')
            return;
        const mql = window.matchMedia(`(min-width: ${breakpoint}px)`);
        const listener = (e) => setIsDesktop(e.matches);
        mql.addEventListener('change', listener);
        // Ensure state is current
        setIsDesktop(mql.matches);
        return () => {
            mql.removeEventListener('change', listener);
        };
    }, [breakpoint, isWeb]);
    return isDesktop;
}
//# sourceMappingURL=ModalStack.js.map