import React, { isValidElement, use, type ReactElement, type ReactNode } from 'react';

import { Split, type SplitHostProps } from '../optional-libraries/react-native-screens';
import { IsWithinNativeNavigator } from '../standard-navigation';
import { Slot } from '../views/Navigator';
import {
  renderSplitViewColumnContent,
  SplitViewColumn,
  SplitViewInspector,
  type SplitViewColumnProps,
} from './elements';

/**
 * For full list of supported props, see [`SplitHostProps`](http://github.com/software-mansion/react-native-screens/blob/main/src/components/gamma/split/SplitHost.types.ts#L117)
 */
export interface SplitViewProps extends Omit<SplitHostProps, 'children'> {
  children?: ReactNode;
  /**
   * Enables React Activity for screens rendered by the detail slot.
   * @default false
   */
  activityEnabled?: boolean;
}

function SplitViewNavigator({ children, activityEnabled, ...splitViewHostProps }: SplitViewProps) {
  if (use(IsWithinNativeNavigator)) {
    throw new Error('SplitView cannot be used inside another native navigator.');
  }

  if (process.env.EXPO_OS !== 'ios') {
    console.warn(
      'SplitView is only supported on iOS. The SplitView will behave like a Slot navigator on other platforms.'
    );
    return <Slot activityEnabled={activityEnabled} />;
  }

  const allChildrenArray = React.Children.toArray(children);
  const columnChildren = allChildrenArray.filter(
    (child): child is ReactElement<SplitViewColumnProps> =>
      isValidElement(child) && child.type === SplitViewColumn
  );
  const inspectorChildren = allChildrenArray.filter(
    (child): child is ReactElement<SplitViewColumnProps> =>
      isValidElement(child) && child.type === SplitViewInspector
  );
  const numberOfSidebars = columnChildren.length;
  const numberOfInspectors = inspectorChildren.length;

  if (allChildrenArray.length !== columnChildren.length + inspectorChildren.length) {
    console.warn(
      'Only SplitView.Column and SplitView.Inspector components are allowed as direct children of SplitView.'
    );
  }

  if (numberOfSidebars > 2) {
    throw new Error('There can only be two SplitView.Column in the SplitView.');
  }

  if (numberOfSidebars + numberOfInspectors === 0) {
    console.warn('No SplitView.Column and SplitView.Inspector found in SplitView.');
    return <Slot activityEnabled={activityEnabled} />;
  }

  // Split.Host recognizes its columns and inspectors by element type, to count them and give each column its
  // index, so they are passed as Split.Column and Split.Inspector elements instead of SplitView wrappers.
  // The key is needed, because number of columns cannot be changed dynamically
  return (
    <IsWithinNativeNavigator value>
      <Split.Host key={numberOfSidebars + numberOfInspectors} {...splitViewHostProps}>
        {columnChildren.map((column) => (
          <Split.Column key={column.key}>
            {renderSplitViewColumnContent(column.props.children)}
          </Split.Column>
        ))}
        <Split.Column>
          <Slot activityEnabled={activityEnabled} />
        </Split.Column>
        {inspectorChildren.map((inspector) => (
          <Split.Inspector key={inspector.key}>{inspector.props.children}</Split.Inspector>
        ))}
      </Split.Host>
    </IsWithinNativeNavigator>
  );
}

export const SplitView = Object.assign(SplitViewNavigator, {
  Column: SplitViewColumn,
  Inspector: SplitViewInspector,
});
