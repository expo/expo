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
exports.RNSNativeTabs = RNSNativeTabs;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const RNSNativeTabsScreen_1 = require("./RNSNativeTabsScreen");
function RNSNativeTabs(props) {
    const [lastFocus, setLastFocus] = (0, react_1.useState)(0);
    const [currentFocus, setCurrentFocus] = (0, react_1.useState)(lastFocus);
    const propFocus = react_1.Children.map(props.children, (child) => {
        if (!child ||
            typeof child !== 'object' ||
            !('props' in child) ||
            typeof child.props !== 'object' ||
            !child.props) {
            return null;
        }
        return child.props.isFocused;
    })?.findIndex((child) => child === true);
    if (propFocus !== undefined && propFocus !== lastFocus) {
        setLastFocus(propFocus);
        setCurrentFocus(propFocus);
    }
    return (<react_native_1.View style={styles.root} testID="native-tabs-root">
      {react_1.Children.map(props.children, (child, index) => {
            if (react_1.default.isValidElement(child) && !child.props) {
                return null;
            }
            if (index !== currentFocus) {
                return null;
            }
            return (<>
            <react_native_1.View style={{ flex: 1 }}>{child}</react_native_1.View>
          </>);
        })}
      <react_native_1.View style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            padding: 10,
            backgroundColor: props.tabBarAppearance?.backgroundColor,
        }}>
        {react_1.Children.map(props.children, (child, index) => {
            if (!react_1.default.isValidElement(child) || child?.type !== RNSNativeTabsScreen_1.RNSNativeTabsScreen) {
                return null;
            }
            return (<react_native_1.Pressable onPress={() => {
                    setCurrentFocus(index);
                }} style={{
                    borderColor: 'black',
                    borderWidth: 1,
                    padding: 10,
                }}>
              <react_native_1.Text>{child.props?.badgeValue ?? ''}</react_native_1.Text>
            </react_native_1.Pressable>);
        })}
      </react_native_1.View>
    </react_native_1.View>);
}
const styles = react_native_1.StyleSheet.create({
    root: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
});
//# sourceMappingURL=RNSNativeTabs.js.map