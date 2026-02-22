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
exports.mapProtectedScreen = mapProtectedScreen;
const react_1 = __importStar(require("react"));
const StackHeaderComponent_1 = require("./StackHeaderComponent");
const StackScreen_1 = require("./StackScreen");
const children_1 = require("../../utils/children");
const Protected_1 = require("../../views/Protected");
const Screen_1 = require("../../views/Screen");
function mapProtectedScreen(props) {
    return {
        ...props,
        children: react_1.Children.toArray(props.children)
            .map((child, index) => {
            if ((0, children_1.isChildOfType)(child, StackScreen_1.StackScreen)) {
                const { children, options: childOptions, ...rest } = child.props;
                const options = typeof childOptions === 'function'
                    ? (...params) => (0, StackScreen_1.appendScreenStackPropsToOptions)(childOptions(...params), { children })
                    : (0, StackScreen_1.appendScreenStackPropsToOptions)(childOptions ?? {}, { children });
                return <Screen_1.Screen key={rest.name} {...rest} options={options}/>;
            }
            else if ((0, children_1.isChildOfType)(child, Protected_1.Protected)) {
                return <Protected_1.Protected key={`${index}-${props.guard}`} {...mapProtectedScreen(child.props)}/>;
            }
            else if ((0, children_1.isChildOfType)(child, StackHeaderComponent_1.StackHeaderComponent)) {
                // Ignore Stack.Header, because it can be used to set header options for Stack
                // and we use this function to process children of Stack, as well.
                return null;
            }
            else {
                if (react_1.default.isValidElement(child)) {
                    console.warn(`Unknown child element passed to Stack: ${child.type}`);
                }
                else {
                    console.warn(`Unknown child element passed to Stack: ${child}`);
                }
            }
            return null;
        })
            .filter(Boolean),
    };
}
//# sourceMappingURL=mapProtectedScreen.js.map