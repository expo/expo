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
exports.SelectedStoriesDetail = void 0;
var React = __importStar(require("react"));
var react_native_1 = require("react-native");
var getStories_1 = require("../getStories");
var styles_1 = require("../styles");
// this is resolved via customization (extraNodeModules) in metro-config / webpack-config
// duplication is required as wrapping the require in a function breaks fast refresh
var stories = require('generated-expo-stories');
var storiesById = (0, getStories_1.getByStoryId)(stories);
function SelectedStoriesDetail(_a) {
    var route = _a.route;
    var _b = (route.params || {}).selectedStoryIds, selectedStoryIds = _b === void 0 ? [] : _b;
    var selectedStories = selectedStoryIds.map(function (storyId) { return storiesById[storyId]; });
    return (React.createElement(react_native_1.View, { style: react_native_1.StyleSheet.absoluteFill },
        React.createElement(react_native_1.SafeAreaView, { style: styles_1.styles.flexContainer },
            React.createElement(react_native_1.ScrollView, { style: styles_1.styles.flexContainer }, selectedStories.map(function (story) {
                return (React.createElement(react_native_1.View, { key: "".concat(story.id), style: styles_1.styles.storyRow }, React.createElement(story.component)));
            })))));
}
exports.SelectedStoriesDetail = SelectedStoriesDetail;
//# sourceMappingURL=SelectedStoryDetails.js.map