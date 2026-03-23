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
exports.Screen = Screen;
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const native_1 = require("../native");
const Background_1 = require("./Background");
const HeaderHeightContext_1 = require("./Header/HeaderHeightContext");
const HeaderShownContext_1 = require("./Header/HeaderShownContext");
const getDefaultHeaderHeight_1 = require("./Header/getDefaultHeaderHeight");
const useFrameSize_1 = require("./useFrameSize");
function Screen(props) {
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const isParentHeaderShown = React.useContext(HeaderShownContext_1.HeaderShownContext);
    const parentHeaderHeight = React.useContext(HeaderHeightContext_1.HeaderHeightContext);
    const { focused, modal = false, header, headerShown = true, headerTransparent, headerStatusBarHeight = isParentHeaderShown ? 0 : insets.top, navigation, route, children, style, } = props;
    const defaultHeaderHeight = (0, useFrameSize_1.useFrameSize)((size) => (0, getDefaultHeaderHeight_1.getDefaultHeaderHeight)(size, modal, headerStatusBarHeight));
    const headerRef = React.useRef(null);
    const [headerHeight, setHeaderHeight] = React.useState(defaultHeaderHeight);
    React.useLayoutEffect(() => {
        headerRef.current?.measure((_x, _y, _width, height) => {
            setHeaderHeight(height);
        });
    }, [route.name]);
    return (<Background_1.Background aria-hidden={!focused} style={[styles.container, style]} 
    // On Fabric we need to disable collapsing for the background to ensure
    // that we won't render unnecessary views due to the view flattening.
    collapsable={false}>
      {headerShown ? (<native_1.NavigationProvider route={route} navigation={navigation}>
          <react_native_1.View ref={headerRef} pointerEvents="box-none" onLayout={(e) => {
                const { height } = e.nativeEvent.layout;
                setHeaderHeight(height);
            }} style={[styles.header, headerTransparent ? styles.absolute : null]}>
            {header}
          </react_native_1.View>
        </native_1.NavigationProvider>) : null}
      <react_native_1.View style={styles.content}>
        <HeaderShownContext_1.HeaderShownContext.Provider value={isParentHeaderShown || headerShown !== false}>
          <HeaderHeightContext_1.HeaderHeightContext.Provider value={headerShown ? headerHeight : (parentHeaderHeight ?? 0)}>
            {children}
          </HeaderHeightContext_1.HeaderHeightContext.Provider>
        </HeaderShownContext_1.HeaderShownContext.Provider>
      </react_native_1.View>
    </Background_1.Background>);
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    header: {
        zIndex: 1,
    },
    absolute: {
        position: 'absolute',
        top: 0,
        start: 0,
        end: 0,
    },
});
//# sourceMappingURL=Screen.js.map