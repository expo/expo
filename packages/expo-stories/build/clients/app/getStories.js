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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getByStoryId = exports.getByFileId = void 0;
function getByFileId(stories) {
    var filesById = Object.keys(stories).reduce(function (acc, storyId) {
        var story = stories[storyId];
        if (!acc[story.file.id]) {
            acc[story.file.id] = __assign(__assign({}, story.file), { storyIds: [] });
        }
        acc[story.file.id].storyIds.push(storyId);
        return acc;
    }, {});
    return filesById;
}
exports.getByFileId = getByFileId;
function getByStoryId(stories) {
    var storiesById = Object.keys(stories).reduce(function (acc, id) {
        var story = stories[id];
        acc[story.storyConfig.id] = __assign(__assign({}, story.storyConfig), { file: story.file, component: stories[story.storyConfig.id] || null });
        return acc;
    }, {});
    return storiesById;
}
exports.getByStoryId = getByStoryId;
//# sourceMappingURL=getStories.js.map