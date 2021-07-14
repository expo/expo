"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
var styleguide_native_1 = require("@expo/styleguide-native");
var React = __importStar(require("react"));
var react_native_1 = require("react-native");
var ExpoStoryLoader_1 = require("./ExpoStoryLoader");
var async_stack_1 = require("./async-stack");
// this is resolved via customization (extraNodeModules) in metro-config / webpack-config
var stories = require('generated-expo-stories');
// aggregate stories
var storyData = {};
Object.keys(stories).forEach(function (key) {
    var story = stories[key];
    var storyConfig = story.storyConfig;
    var parentConfig = story.parentConfig;
    if (!storyData[parentConfig.id]) {
        storyData[parentConfig.id] = __assign(__assign({}, parentConfig), { stories: [] });
    }
    storyData[parentConfig.id].stories.push(storyConfig);
});
function App() {
    return (React.createElement(async_stack_1.StackContainer, null,
        React.createElement(ExpoStoryApp, null)));
}
exports.default = App;
function ExpoStoryApp() {
    var parentStories = [];
    Object.keys(storyData).forEach(function (key) {
        var parentStory = storyData[key];
        parentStories.push(parentStory);
    });
    return (React.createElement(react_native_1.SafeAreaView, { style: styles.flexContainer },
        React.createElement(react_native_1.View, { style: styles.flexContainer },
            React.createElement(react_native_1.Text, { style: styles.storyTitle }, "Expo Story Loader"),
            React.createElement(react_native_1.ScrollView, { style: styles.storyButtonsContainer }, parentStories.map(function (story) {
                return (React.createElement(StoryButton, { key: story.id, title: story.title, onPress: function () {
                        async_stack_1.Stack.push({
                            element: React.createElement(StoriesScreen, { parentStoryId: story.id }),
                            headerProps: { title: story.title },
                        });
                    } }));
            })))));
}
function StoriesScreen(_a) {
    var parentStoryId = _a.parentStoryId;
    var parentStories = [];
    Object.keys(storyData).forEach(function (key) {
        if (key === parentStoryId) {
            parentStories.push(storyData[key]);
        }
    });
    return (React.createElement(react_native_1.SafeAreaView, { style: styles.flexContainer },
        React.createElement(react_native_1.ScrollView, { style: styles.flexContainer }, parentStories.map(function (story) {
            return (React.createElement(react_native_1.View, { key: story.id },
                story.stories.map(function (s) {
                    return (React.createElement(StoryButton, { key: s.id, title: s.name, onPress: function () {
                            async_stack_1.Stack.push({
                                element: React.createElement(ExpoStoryLoader_1.ExpoStoryLoader, { selectedStoryId: s.id }),
                                headerProps: { title: s.name },
                            });
                        } }));
                }),
                story.stories.length > 1 && (React.createElement(StoryButton, { title: "See All", color: styleguide_native_1.lightTheme.button.tertiary.background, onPress: function () {
                        async_stack_1.Stack.push({
                            element: React.createElement(ExpoStoryLoader_1.ExpoStoryLoader, { selectedStoryId: story.id, displayStoryTitle: true }),
                            headerProps: { title: story.title + " Stories" },
                        });
                    } }))));
        }))));
}
function StoryButton(_a) {
    var title = _a.title, _b = _a.color, color = _b === void 0 ? styleguide_native_1.lightTheme.button.primary.background : _b, onPress = _a.onPress;
    return (
    // @ts-ignore
    React.createElement(react_native_1.Pressable, { style: [styles.storyButton, { backgroundColor: color }], onPress: onPress },
        React.createElement(react_native_1.Text, { style: styles.storyButtonText }, title)));
}
var styles = react_native_1.StyleSheet.create({
    flexContainer: {
        flex: 1,
        backgroundColor: styleguide_native_1.lightTheme.background.default,
        padding: styleguide_native_1.spacing[3],
    },
    storyTitle: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    storyButtonsContainer: {
        padding: styleguide_native_1.spacing[4],
        backgroundColor: styleguide_native_1.lightTheme.background.default,
    },
    storyButton: __assign({ borderRadius: 4, paddingVertical: styleguide_native_1.spacing[4], marginVertical: styleguide_native_1.spacing[2], backgroundColor: styleguide_native_1.lightTheme.button.primary.background }, styleguide_native_1.shadows.button),
    storyButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: styleguide_native_1.lightTheme.button.primary.foreground,
        textAlign: 'center',
    },
    refreshButton: {
        position: 'absolute',
        padding: styleguide_native_1.spacing[3],
        bottom: styleguide_native_1.spacing[6],
        left: 0,
        right: 0,
    },
    refreshLoader: {
        position: 'absolute',
        right: styleguide_native_1.spacing[4],
        bottom: 0,
        top: 0,
    },
    loadingContainer: __assign(__assign({}, react_native_1.StyleSheet.absoluteFillObject), { justifyContent: 'center', alignItems: 'center' }),
});
//# sourceMappingURL=ExpoStoryApp.js.map