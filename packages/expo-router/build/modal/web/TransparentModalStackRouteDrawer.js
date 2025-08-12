"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransparentModalStackRouteDrawer = TransparentModalStackRouteDrawer;
const react_1 = __importDefault(require("react"));
const vaul_1 = require("vaul");
const modalStyles_1 = __importDefault(require("./modalStyles"));
function TransparentModalStackRouteDrawer({ routeKey, options, renderScreen, onDismiss, }) {
    const handleOpenChange = (open) => {
        if (!open)
            onDismiss();
    };
    return (<vaul_1.Drawer.Root defaultOpen autoFocus key={`${routeKey}-transparent`} dismissible={options.gestureEnabled ?? false} onAnimationEnd={handleOpenChange}>
      <vaul_1.Drawer.Portal>
        <vaul_1.Drawer.Content className={modalStyles_1.default.transparentDrawerContent}>
          {/* TODO:(@Hirbod) Figure out how to add title and description to the modal for screen readers in a meaningful way */}
          <vaul_1.Drawer.Title about="" aria-describedby="" className={modalStyles_1.default.srOnly}/>
          <vaul_1.Drawer.Description about="" className={modalStyles_1.default.srOnly}/>
          {/* Render the screen content */}
          <div className={modalStyles_1.default.modalBody}>{renderScreen()}</div>
        </vaul_1.Drawer.Content>
      </vaul_1.Drawer.Portal>
    </vaul_1.Drawer.Root>);
}
//# sourceMappingURL=TransparentModalStackRouteDrawer.js.map