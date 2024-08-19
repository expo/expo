"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabsStateContext = exports.TabsDescriptorsContext = void 0;
const react_1 = require("react");
exports.TabsDescriptorsContext = (0, react_1.createContext)({});
exports.TabsStateContext = (0, react_1.createContext)({
    type: 'tab',
    history: [],
    index: -1,
    key: '',
    stale: false,
    routeNames: [],
    routes: [],
});
//# sourceMappingURL=Tab-shared.js.map