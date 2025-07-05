"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransparentModalStackRouteDrawer = TransparentModalStackRouteDrawer;
exports.useIsDesktop = useIsDesktop;
const react_1 = __importDefault(require("react"));
const vaul_1 = require("vaul");
const modalStyles_1 = __importDefault(require("./modalStyles"));
function TransparentModalStackRouteDrawer({ routeKey, options, renderScreen, onDismiss, }) {
    const handleOpenChange = (open) => {
        if (!open)
            onDismiss();
    };
    return (<vaul_1.Drawer.Root defaultOpen key={`${routeKey}-transparent`} dismissible={options.gestureEnabled ?? false} onAnimationEnd={handleOpenChange}>
      <vaul_1.Drawer.Portal>
        <vaul_1.Drawer.Content className={modalStyles_1.default.transparentDrawerContent}>
          {/* Figure out how to add title and description to the modal for screen readers */}
          <vaul_1.Drawer.Title about="" aria-describedby="" className={modalStyles_1.default.srOnly}/>
          <vaul_1.Drawer.Description about="" className={modalStyles_1.default.srOnly}/>
          {/* Render the screen content */}
          <div className={modalStyles_1.default.modalBody}>{renderScreen()}</div>
        </vaul_1.Drawer.Content>
      </vaul_1.Drawer.Portal>
    </vaul_1.Drawer.Root>);
}
/**
 * SSR-safe viewport detection: initial render always returns `false` so that
 * server and client markup match. The actual media query evaluation happens
 * after mount.
 *
 * @internal
 */
function useIsDesktop(breakpoint = 768) {
    const isWeb = process.env.EXPO_OS === 'web';
    // Ensure server-side and initial client render agree (mobile first).
    const [isDesktop, setIsDesktop] = react_1.default.useState(false);
    react_1.default.useEffect(() => {
        if (!isWeb || typeof window === 'undefined')
            return;
        const mql = window.matchMedia(`(min-width: ${breakpoint}px)`);
        const listener = (e) => setIsDesktop(e.matches);
        // Update immediately after mount
        setIsDesktop(mql.matches);
        mql.addEventListener('change', listener);
        return () => mql.removeEventListener('change', listener);
    }, [breakpoint, isWeb]);
    return isDesktop;
}
//# sourceMappingURL=TransparentModalStackRouteDrawer.web.js.map