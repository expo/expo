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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectedStoryFilesList = void 0;
var React = __importStar(require("react"));
var react_native_1 = require("react-native");
var components_1 = require("../../../components");
var getStories_1 = require("../getStories");
var styles_1 = require("../styles");
// this is resolved via customization (extraNodeModules) in metro-config / webpack-config
// duplication is required as wrapping the require in a function breaks fast refresh
var stories = require('generated-expo-stories');
var filesById = (0, getStories_1.getByFileId)(stories);
var storiesById = (0, getStories_1.getByStoryId)(stories);
function SelectedStoryFilesList(_a) {
    var navigation = _a.navigation, route = _a.route;
    var _b = React.useState([]), selectedStoryIds = _b[0], setSelectedStoryIds = _b[1];
    var _c = (route.params || {}).storyFileIds, storyFileIds = _c === void 0 ? [] : _c;
    var storyIds = Object.keys(storiesById);
    var allSelected = selectedStoryIds.length === storyIds.length;
    React.useLayoutEffect(function () {
        navigation.setOptions({
            headerRight: function () {
                var label = allSelected ? 'Clear All' : 'Select All';
                function handlePress() {
                    setSelectedStoryIds(allSelected ? [] : __spreadArray([], storyIds, true));
                }
                return React.createElement(react_native_1.Button, { title: label, onPress: handlePress });
            },
        });
    }, [navigation, allSelected]);
    function onSelectSingle(id) {
        setSelectedStoryIds(function (currentIds) {
            return currentIds.includes(id) ? currentIds.filter(function (i) { return id !== i; }) : __spreadArray(__spreadArray([], currentIds, true), [id], false);
        });
    }
    function onSeeSelectionPress() {
        navigation.navigate('Stories Detail', {
            selectedStoryIds: selectedStoryIds,
            title: '',
        });
    }
    var data = storyFileIds.map(function (fileId) {
        var file = filesById[fileId];
        return {
            title: file.title,
            data: file.storyIds,
        };
    });
    return (React.createElement(react_native_1.View, { style: styles_1.styles.flexContainer },
        React.createElement(react_native_1.SectionList, { sections: data, keyExtractor: function (item, index) { return item + index; }, renderSectionHeader: function (_a) {
                var section = _a.section;
                return (React.createElement(react_native_1.View, { style: styles_1.styles.sectionHeaderContainer },
                    React.createElement(react_native_1.Text, { style: styles_1.styles.sectionHeader }, section.title)));
            }, renderItem: function (_a) {
                var storyId = _a.item;
                var story = storiesById[storyId];
                return (React.createElement(components_1.ListRow, { variant: "ghost", label: story.name, onPress: function () { return onSelectSingle(story.id); }, isSelected: selectedStoryIds.includes(story.id), multiSelectActive: true }));
            } }),
        selectedStoryIds.length > 0 && (React.createElement(react_native_1.View, { style: styles_1.styles.seeSelectionButtonContainer },
            React.createElement(components_1.Button, { label: "See Selection", variant: "tertiary", onPress: onSeeSelectionPress })))));
}
exports.SelectedStoryFilesList = SelectedStoryFilesList;
//# sourceMappingURL=SelectedStoryFilesList.js.map