"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolbarHost = exports.ToolbarCustomView = exports.ToolbarSpacer = exports.ToolbarButton = exports.ToolbarMenuAction = exports.ToolbarMenu = void 0;
const non_secure_1 = require("nanoid/non-secure");
const react_1 = require("react");
const react_native_1 = require("react-native");
const native_1 = require("./native");
const InternalLinkPreviewContext_1 = require("../link/InternalLinkPreviewContext");
const elements_1 = require("../link/elements");
exports.ToolbarMenu = elements_1.LinkMenu;
exports.ToolbarMenuAction = elements_1.LinkMenuAction;
const ToolbarButton = ({ children, sf, onPress, ...rest }) => {
    const id = (0, react_1.useMemo)(() => (0, non_secure_1.nanoid)(), []);
    return (<native_1.RouterToolbarItem {...rest} onSelected={onPress} identifier={id} title={children} systemImageName={sf}/>);
};
exports.ToolbarButton = ToolbarButton;
const ToolbarSpacer = ({ width, ...rest }) => {
    const id = (0, react_1.useMemo)(() => (0, non_secure_1.nanoid)(), []);
    return (<native_1.RouterToolbarItem {...rest} identifier={id} type={width ? 'fixedSpacer' : 'fluidSpacer'} width={width}/>);
};
exports.ToolbarSpacer = ToolbarSpacer;
const ToolbarCustomView = ({ children, style, ...rest }) => {
    const id = (0, react_1.useMemo)(() => (0, non_secure_1.nanoid)(), []);
    return (<native_1.RouterToolbarItem {...rest} identifier={id}>
      <react_native_1.View style={[style, { position: 'absolute' }]}>{children}</react_native_1.View>
    </native_1.RouterToolbarItem>);
};
exports.ToolbarCustomView = ToolbarCustomView;
const ToolbarHost = (props) => {
    // TODO: Replace InternalLinkPreviewContext with a more generic context
    return (<InternalLinkPreviewContext_1.InternalLinkPreviewContext value={{ isVisible: false, href: '' }}>
      <native_1.RouterToolbarHost {...props}/>
    </InternalLinkPreviewContext_1.InternalLinkPreviewContext>);
};
exports.ToolbarHost = ToolbarHost;
//# sourceMappingURL=elements.js.map