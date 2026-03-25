"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrawerContent = DrawerContent;
const DrawerContentScrollView_1 = require("./DrawerContentScrollView");
const DrawerItemList_1 = require("./DrawerItemList");
function DrawerContent({ descriptors, state, ...rest }) {
    const focusedRoute = state.routes[state.index];
    const focusedDescriptor = descriptors[focusedRoute.key];
    const focusedOptions = focusedDescriptor.options;
    const { drawerContentStyle, drawerContentContainerStyle } = focusedOptions;
    return (<DrawerContentScrollView_1.DrawerContentScrollView {...rest} contentContainerStyle={drawerContentContainerStyle} style={drawerContentStyle}>
      <DrawerItemList_1.DrawerItemList descriptors={descriptors} state={state} {...rest}/>
    </DrawerContentScrollView_1.DrawerContentScrollView>);
}
//# sourceMappingURL=DrawerContent.js.map