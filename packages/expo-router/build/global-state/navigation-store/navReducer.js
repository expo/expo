"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reset = exports.commitSlices = exports.replaceRoot = exports.seed = void 0;
exports.navReducer = navReducer;
const replaceSliceByKey_1 = require("./replaceSliceByKey");
const seed = (tree) => ({ type: 'SEED', tree });
exports.seed = seed;
const replaceRoot = (tree) => ({ type: 'REPLACE_ROOT', tree });
exports.replaceRoot = replaceRoot;
const commitSlices = (slices) => ({
    type: 'COMMIT_SLICES',
    slices,
});
exports.commitSlices = commitSlices;
const reset = (tree) => ({ type: 'RESET', tree });
exports.reset = reset;
function navReducer(tree, action) {
    switch (action.type) {
        case 'SEED':
        case 'REPLACE_ROOT':
        case 'RESET':
            return action.tree;
        case 'COMMIT_SLICES':
            // Apply in dispatch order so a parent write and a child write in the same commit compose.
            // Unknown keys are no-ops (`replaceSliceByKey` returns the same reference), which also keeps
            // memoization intact for slices that were never seeded yet (lazy navigators).
            return action.slices.reduce((current, { key, slice }) => (0, replaceSliceByKey_1.replaceSliceByKey)(current, key, slice), tree);
        default:
            return tree;
    }
}
//# sourceMappingURL=navReducer.js.map