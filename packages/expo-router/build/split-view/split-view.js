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
exports.Sidebar = void 0;
const react_1 = __importStar(require("react"));
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const experimental_1 = require("react-native-screens/experimental");
const elements_1 = require("./elements");
const Navigator_1 = require("../views/Navigator");
const ParentSideBarContext = react_1.default.createContext(0);
const ChildrenSideBarContext = react_1.default.createContext({ addChild: () => { }, removeChild: () => { } });
function SidebarNavigator({ children, displayMode }) {
    const numberOfParentSidebars = react_1.default.useContext(ParentSideBarContext);
    const { addChild, removeChild } = react_1.default.useContext(ChildrenSideBarContext);
    const [numberOfChildrenSidebars, setNumberOfChildrenSidebars] = react_1.default.useState(0);
    const value = react_1.default.useMemo(() => ({
        addChild: () => setNumberOfChildrenSidebars((c) => c + 1),
        removeChild: () => setNumberOfChildrenSidebars((c) => c - 1),
    }), []);
    (0, react_1.useEffect)(() => {
        addChild();
        return () => {
            removeChild();
        };
    }, []);
    if (numberOfParentSidebars > 1) {
        throw new Error('Sidebar cannot be nested more than one level deep');
    }
    (0, react_1.useEffect)(() => {
        if (numberOfChildrenSidebars > 0 && displayMode) {
            console.warn('`displayMode` can only be set on the primary sidebar.');
        }
    }, [displayMode]);
    const Wrapper = ({ children }) => (<ParentSideBarContext value={numberOfParentSidebars + 1}>
      <ChildrenSideBarContext value={value}>{children}</ChildrenSideBarContext>
    </ParentSideBarContext>);
    if (numberOfParentSidebars > 0) {
        return (<Wrapper>
        <experimental_1.SplitViewScreen.Column>{children}</experimental_1.SplitViewScreen.Column>
        <experimental_1.SplitViewScreen.Column>
          <Navigator_1.Slot />
        </experimental_1.SplitViewScreen.Column>
      </Wrapper>);
    }
    const numberOfScreens = numberOfChildrenSidebars === 0 ? 'one' : 'two';
    const mode = displayMode === 'over' ? 'Over' : 'Beside';
    const preferredDisplayMode = `${numberOfScreens}${mode}Secondary`;
    return (<Wrapper>
      <experimental_1.SplitViewHost key={numberOfChildrenSidebars} preferredDisplayMode={preferredDisplayMode} displayModeButtonVisibility="always">
        <experimental_1.SplitViewScreen.Column>
          <react_native_safe_area_context_1.SafeAreaProvider>{children}</react_native_safe_area_context_1.SafeAreaProvider>
        </experimental_1.SplitViewScreen.Column>
        {numberOfChildrenSidebars === 0 ? (<>
            <experimental_1.SplitViewScreen.Column />
            <experimental_1.SplitViewScreen.Column>
              <Navigator_1.Slot />
            </experimental_1.SplitViewScreen.Column>
          </>) : (<Navigator_1.Slot />)}
      </experimental_1.SplitViewHost>
    </Wrapper>);
}
exports.Sidebar = Object.assign(SidebarNavigator, {
    Trigger: elements_1.SidebarTrigger,
    Header: elements_1.SidebarHeader,
});
//# sourceMappingURL=split-view.js.map