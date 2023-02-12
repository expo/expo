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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
var stack_1 = require("@react-navigation/stack");
var React = __importStar(require("react"));
var SelectedStoryDetails_1 = require("./screens/SelectedStoryDetails");
var SelectedStoryFilesList_1 = require("./screens/SelectedStoryFilesList");
var StoryFilesList_1 = require("./screens/StoryFilesList");
var RNStack = (0, stack_1.createStackNavigator)();
function App(_a) {
    var _b = _a.title, title = _b === void 0 ? '' : _b;
    return (React.createElement(RNStack.Navigator, null,
        React.createElement(RNStack.Screen, { name: "Story Files", component: StoryFilesList_1.StoryFilesList, options: { title: title } }),
        React.createElement(RNStack.Screen, { name: "Selected Stories", component: SelectedStoryFilesList_1.SelectedStoryFilesList, options: function (_a) {
                var _b;
                var route = _a.route;
                return ({
                    title: ((_b = route.params) === null || _b === void 0 ? void 0 : _b.title) || '',
                });
            } }),
        React.createElement(RNStack.Screen, { name: "Stories Detail", component: SelectedStoryDetails_1.SelectedStoriesDetail, options: function (_a) {
                var _b;
                var route = _a.route;
                return ({
                    title: ((_b = route.params) === null || _b === void 0 ? void 0 : _b.title) || '',
                });
            } })));
}
exports.App = App;
//# sourceMappingURL=App.js.map