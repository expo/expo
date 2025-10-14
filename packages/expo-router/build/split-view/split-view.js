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
exports.SplitView = void 0;
const react_1 = __importStar(require("react"));
const experimental_1 = require("react-native-screens/experimental");
const elements_1 = require("./elements");
const Navigator_1 = require("../views/Navigator");
const react_native_1 = require("react-native");
const SplitViewContext = (0, react_1.createContext)(0);
function SplitViewNavigator({ children, displayMode }) {
    const numberOfParentSidebars = react_1.default.useContext(SplitViewContext);
    if (numberOfParentSidebars > 0) {
        throw new Error('There can only be one SplitView in the navigation hierarchy.');
    }
    const WrappedSlot = () => (<SplitViewContext value={numberOfParentSidebars + 1}>
      <Navigator_1.Slot />
    </SplitViewContext>);
    const allChildrenArray = react_1.default.Children.toArray(children);
    const columnChildren = allChildrenArray.filter((child) => (0, react_1.isValidElement)(child) && child.type === elements_1.SplitViewColumn);
    const numberOfSidebars = columnChildren.length;
    if (allChildrenArray.length !== columnChildren.length) {
        console.warn('Only SplitView.Column components are allowed as direct children of SplitView.');
    }
    if (numberOfSidebars > 2) {
        throw new Error('There can only be two SplitView.Column in the SplitView.');
    }
    const numberOfScreens = numberOfSidebars === 1 ? 'one' : 'two';
    const mode = displayMode === 'over' ? 'Over' : 'Beside';
    const preferredDisplayMode = numberOfSidebars === 0 ? 'secondaryOnly' : `${numberOfScreens}${mode}Secondary`;
    return (<experimental_1.SplitViewHost preferredDisplayMode={preferredDisplayMode} preferredSplitBehavior="tile" displayModeButtonVisibility="always">
      {numberOfSidebars === 0 && (<experimental_1.SplitViewScreen.Column>
          <react_native_1.View />
        </experimental_1.SplitViewScreen.Column>)}
      {numberOfSidebars < 2 && (<experimental_1.SplitViewScreen.Column>
          <react_native_1.View />
        </experimental_1.SplitViewScreen.Column>)}
      {columnChildren}
      <experimental_1.SplitViewScreen.Column>
        <WrappedSlot />
      </experimental_1.SplitViewScreen.Column>
    </experimental_1.SplitViewHost>);
}
exports.SplitView = Object.assign(SplitViewNavigator, {
    Column: elements_1.SplitViewColumn,
});
//# sourceMappingURL=split-view.js.map