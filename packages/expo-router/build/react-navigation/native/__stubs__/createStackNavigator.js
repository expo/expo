"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStackNavigator = createStackNavigator;
const core_1 = require("../../core");
const StackNavigator = (props) => {
    const { state, descriptors, NavigationContent } = (0, core_1.useNavigationBuilder)(core_1.StackRouter, props);
    return (<NavigationContent>{descriptors[state.routes[state.index].key].render()}</NavigationContent>);
};
function createStackNavigator() {
    return (0, core_1.createNavigatorFactory)(StackNavigator)();
}
//# sourceMappingURL=createStackNavigator.js.map