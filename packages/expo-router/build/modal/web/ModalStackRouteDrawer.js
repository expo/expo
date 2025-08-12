"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModalStackRouteDrawer = ModalStackRouteDrawer;
const react_1 = __importDefault(require("react"));
const vaul_1 = require("vaul");
const modalStyles_1 = __importDefault(require("./modalStyles"));
const utils_1 = require("./utils");
function ModalStackRouteDrawer({ routeKey, options, renderScreen, onDismiss, themeColors, }) {
    const [open, setOpen] = react_1.default.useState(true);
    // Determine sheet vs. modal with an SSR-safe hook. The first render (during
    // hydration) always assumes mobile/sheet to match the server markup; an
    // effect then updates the state after mount if the viewport is desktop.
    const isDesktop = (0, utils_1.useIsDesktop)();
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
    // Update the snap value when custom snap points change.
    react_1.default.useEffect(() => {
        if (isSheet) {
            const next = useCustomSnapPoints && isArrayDetents ? allowed[0] : 1;
            setSnap(next);
        }
        else {
            // Desktop modal always fixed snap at 1
            setSnap(1);
        }
    }, [isSheet, useCustomSnapPoints, isArrayDetents, allowed]);
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
        if (options.webModalStyle?.width) {
            modalStyleVars['--expo-router-modal-width'] =
                typeof options.webModalStyle.width === 'number'
                    ? `${options.webModalStyle.width}px`
                    : options.webModalStyle.width;
            modalStyleVars['--expo-router-modal-max-width'] =
                typeof options.webModalStyle.width === 'number'
                    ? `${options.webModalStyle.width}px`
                    : options.webModalStyle.width;
            // Also set explicit width so browsers that ignore CSS vars in `width` prop still work.
            modalStyleVars.width =
                typeof options.webModalStyle.width === 'number'
                    ? `${options.webModalStyle.width}px`
                    : options.webModalStyle.width;
        }
        // Min width override
        if (options.webModalStyle?.minWidth) {
            const mw = typeof options.webModalStyle.minWidth === 'number'
                ? `${options.webModalStyle.minWidth}px`
                : options.webModalStyle.minWidth;
            modalStyleVars['--expo-router-modal-min-width'] = mw;
            modalStyleVars.minWidth = mw;
        }
        if (options.webModalStyle?.height) {
            const h = typeof options.webModalStyle.height === 'number'
                ? `${options.webModalStyle.height}px`
                : options.webModalStyle.height;
            modalStyleVars['--expo-router-modal-height'] = h;
            modalStyleVars.maxHeight = h;
            modalStyleVars.height = h;
            modalStyleVars.minHeight = h;
        }
        // Separate min-height override (takes precedence over modalHeight)
        if (options.webModalStyle?.minHeight) {
            const mh = typeof options.webModalStyle.minHeight === 'number'
                ? `${options.webModalStyle.minHeight}px`
                : options.webModalStyle.minHeight;
            modalStyleVars['--expo-router-modal-min-height'] = mh;
            modalStyleVars.minHeight = mh;
        }
    }
    const fitToContents = options.sheetAllowedDetents === 'fitToContents';
    if (fitToContents) {
        modalStyleVars.height = 'auto';
        modalStyleVars.minHeight = 'auto';
        // TODO:(@Hirbod) Clarify if we should limit maxHeight to sheets only
        // Allow sheet to grow with content but never exceed viewport height
        // dvh is important, otherwise it will scale over the visible viewport height
        modalStyleVars.maxHeight = '100dvh';
    }
    // Apply corner radius (default 10px)
    const radiusValue = options.sheetCornerRadius ?? 10;
    const radiusCss = typeof radiusValue === 'number' ? `${radiusValue}px` : radiusValue;
    if (options.webModalStyle?.border) {
        modalStyleVars['--expo-router-modal-border'] = options.webModalStyle.border;
    }
    if (isSheet) {
        // Only top corners for mobile sheet
        modalStyleVars.borderTopLeftRadius = radiusCss;
        modalStyleVars.borderTopRightRadius = radiusCss;
        // Only apply CSS var override if a custom corner radius was provided
        if (options.sheetCornerRadius) {
            modalStyleVars['--expo-router-modal-border-radius'] = radiusCss;
        }
    }
    else {
        // All corners for desktop modal
        if (options.sheetCornerRadius) {
            modalStyleVars['--expo-router-modal-border-radius'] = radiusCss;
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
    return (<vaul_1.Drawer.Root key={`${routeKey}-${isSheet ? 'sheet' : 'modal'}`} open={open} dismissible={options.gestureEnabled ?? true} onAnimationEnd={handleOpenChange} shouldScaleBackground autoFocus onOpenChange={setOpen} {...sheetProps}>
      <vaul_1.Drawer.Portal>
        <vaul_1.Drawer.Overlay className={modalStyles_1.default.overlay} style={options.webModalStyle?.overlayBackground
            ? {
                '--expo-router-modal-overlay-background': options.webModalStyle.overlayBackground,
            }
            : undefined}/>
        <vaul_1.Drawer.Content aria-describedby="modal-description" className={modalStyles_1.default.drawerContent} style={{
            pointerEvents: 'none',
            // This needs to be limited to sheets, otherwise it will position the modal at the bottom of the screen
            ...(isSheet && fitToContents ? { height: 'auto' } : null),
        }}>
          <div className={modalStyles_1.default.modal} data-presentation={isSheet ? 'formSheet' : 'modal'} style={modalStyleVars}>
            {/* TODO:(@Hirbod) Figure out how to add title and description to the modal for screen readers in a meaningful way */}
            <vaul_1.Drawer.Title about="" aria-describedby="" className={modalStyles_1.default.srOnly}/>
            <vaul_1.Drawer.Description about="" className={modalStyles_1.default.srOnly}/>
            {/* Render the screen content */}
            <div className={modalStyles_1.default.modalBody}>{renderScreen()}</div>
          </div>
        </vaul_1.Drawer.Content>
      </vaul_1.Drawer.Portal>
    </vaul_1.Drawer.Root>);
}
//# sourceMappingURL=ModalStackRouteDrawer.js.map