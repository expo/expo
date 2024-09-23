"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabsStateContext = exports.TabsNavigatorContext = exports.TabsDescriptorsContext = exports.TabTriggerMapContext = exports.TabContext = void 0;
const react_1 = require("react");
exports.TabContext = (0, react_1.createContext)({});
exports.TabTriggerMapContext = (0, react_1.createContext)({});
exports.TabsDescriptorsContext = (0, react_1.createContext)({});
exports.TabsNavigatorContext = (0, react_1.createContext)(null);
exports.TabsStateContext = (0, react_1.createContext)({
    type: 'tab',
    history: [],
    index: -1,
    key: '',
    stale: false,
    routeNames: [],
    routes: [],
});
//# sourceMappingURL=TabContext.js.map