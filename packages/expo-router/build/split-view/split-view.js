import React, { createContext, isValidElement, use } from 'react';
import { Split } from 'react-native-screens/experimental';
import { SplitViewColumn, SplitViewInspector } from './elements';
import { IsWithinLayoutContext } from '../layouts/IsWithinLayoutContext';
import { Slot } from '../views/Navigator';
const IsWithinSplitViewContext = createContext(false);
function SplitViewNavigator({ children, ...splitViewHostProps }) {
    if (use(IsWithinSplitViewContext)) {
        throw new Error('There can only be one SplitView in the navigation hierarchy.');
    }
    // TODO: Add better way of detecting if SplitView is rendered inside Native navigator.
    if (use(IsWithinLayoutContext)) {
        throw new Error('SplitView cannot be used inside another navigator, except for Slot.');
    }
    if (process.env.EXPO_OS !== 'ios') {
        console.warn('SplitView is only supported on iOS. The SplitView will behave like a Slot navigator on other platforms.');
        return <Slot />;
    }
    const WrappedSlot = () => (<IsWithinLayoutContext value>
      <Slot />
    </IsWithinLayoutContext>);
    const allChildrenArray = React.Children.toArray(children);
    const columnChildren = allChildrenArray.filter((child) => isValidElement(child) && child.type === SplitViewColumn);
    const inspectorChildren = allChildrenArray.filter((child) => isValidElement(child) && child.type === SplitViewInspector);
    const numberOfSidebars = columnChildren.length;
    const numberOfInspectors = inspectorChildren.length;
    if (allChildrenArray.length !== columnChildren.length + inspectorChildren.length) {
        console.warn('Only SplitView.Column and SplitView.Inspector components are allowed as direct children of SplitView.');
    }
    if (numberOfSidebars > 2) {
        throw new Error('There can only be two SplitView.Column in the SplitView.');
    }
    if (numberOfSidebars + numberOfInspectors === 0) {
        console.warn('No SplitView.Column and SplitView.Inspector found in SplitView.');
        return <Slot />;
    }
    // The key is needed, because number of columns cannot be changed dynamically
    return (<Split.Host key={numberOfSidebars + numberOfInspectors} {...splitViewHostProps}>
      {columnChildren}
      <Split.Column>
        <WrappedSlot />
      </Split.Column>
      {inspectorChildren}
    </Split.Host>);
}
export const SplitView = Object.assign(SplitViewNavigator, {
    Column: SplitViewColumn,
    Inspector: SplitViewInspector,
});
//# sourceMappingURL=split-view.js.map