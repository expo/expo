"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unstable_navigationEvents = exports.areNavigationEventsEnabled = exports.internal_navigationEventEmitter = void 0;
const availableEvents = ['pageWillRender', 'pageFocused', 'pageBlurred', 'pageRemoved'];
exports.internal_navigationEventEmitter = new globalThis.expo.EventEmitter();
let _areNavigationEventsEnabled = false;
const areNavigationEventsEnabled = () => _areNavigationEventsEnabled;
exports.areNavigationEventsEnabled = areNavigationEventsEnabled;
exports.unstable_navigationEvents = {
    addListener: exports.internal_navigationEventEmitter.addListener.bind(exports.internal_navigationEventEmitter),
    removeListener: exports.internal_navigationEventEmitter.removeListener.bind(exports.internal_navigationEventEmitter),
    enableNavigationEvents: () => {
        _areNavigationEventsEnabled = true;
    },
};
//# sourceMappingURL=index.js.map