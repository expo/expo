'use client';
import { createNavigatorFactory, StackRouter, useNavigationBuilder, } from '../../core';
const StackNavigator = (props) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);
    return (<NavigationContent>{descriptors[state.routes[state.index].key].render()}</NavigationContent>);
};
export function createStackNavigator() {
    return createNavigatorFactory(StackNavigator)();
}
//# sourceMappingURL=createStackNavigator.js.map