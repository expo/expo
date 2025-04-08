"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabsStateContext = exports.TabsNavigatorContext = exports.TabsDescriptorsContext = exports.TabTriggerMapContext = exports.TabContext = void 0;
const react_1 = require("react");
exports.TabContext = (0, react_1.createContext)({});
/**
 * @hidden
 */
exports.TabTriggerMapContext = (0, react_1.createContext)({});
/**
 * @hidden
 */
exports.TabsDescriptorsContext = (0, react_1.createContext)({});
/**
 * @hidden
 */
exports.TabsNavigatorContext = (0, react_1.createContext)(null);
/**
 * @hidden
 */
exports.TabsStateContext = (0, react_1.createContext)({
    type: 'tab',
    preloadedRouteKeys: [],
    history: [],
    index: -1,
    key: '',
    stale: false,
    routeNames: [],
    routes: [],
});
//# sourceMappingURL=TabContext.js.map