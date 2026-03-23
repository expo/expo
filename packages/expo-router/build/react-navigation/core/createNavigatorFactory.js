"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNavigatorFactory = createNavigatorFactory;
const Group_1 = require("./Group");
const Screen_1 = require("./Screen");
/**
 * Higher order component to create a `Navigator` and `Screen` pair.
 * Custom navigators should wrap the navigator component in `createNavigator` before exporting.
 *
 * @param Navigator The navigator component to wrap.
 * @returns Factory method to create a `Navigator` and `Screen` pair.
 */
function createNavigatorFactory(Navigator) {
    function createNavigator(config) {
        if (config != null) {
            return {
                Navigator,
                Screen: Screen_1.Screen,
                Group: Group_1.Group,
                config,
            };
        }
        return {
            Navigator,
            Screen: Screen_1.Screen,
            Group: Group_1.Group,
        };
    }
    return createNavigator;
}
//# sourceMappingURL=createNavigatorFactory.js.map