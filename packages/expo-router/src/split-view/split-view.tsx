import React, { isValidElement, use, useState, type ReactElement, type ReactNode } from 'react';

import { Split, type SplitHostProps } from '../optional-libraries/react-native-screens';
import { IsWithinNativeNavigator } from '../standard-navigation';
import { Slot } from '../views/Navigator';
import { SplitViewColumn, SplitViewInspector, type SplitViewColumnProps } from './elements';
import { getSplitColumnChildren } from './getSplitColumnChildren';

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
  /**
   * Controls the left and right safe area insets that SplitView applies to the content of each column and inspector.
   * By default, SplitView applies them only when it shows more than one column.
   * Set to `false` to apply them also when the split view collapses to one column. Set to `true` to never apply them.
   */
  disableHorizontalSafeAreaInsets?: boolean;
}

function SplitViewNavigator({ children, activityEnabled, ...props }: SplitViewProps) {
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

  // The key is needed, because number of columns cannot be changed dynamically
  return (
    <IsWithinNativeNavigator value>
      <SplitViewHost
        key={numberOfSidebars + numberOfInspectors}
        {...props}
        activityEnabled={activityEnabled}
        columnChildren={columnChildren}
        inspectorChildren={inspectorChildren}
      />
    </IsWithinNativeNavigator>
  );
}

interface SplitViewHostProps extends Omit<SplitViewProps, 'children'> {
  columnChildren: ReactElement<SplitViewColumnProps>[];
  inspectorChildren: ReactElement<SplitViewColumnProps>[];
}

function SplitViewHost({
  columnChildren,
  inspectorChildren,
  activityEnabled,
  disableHorizontalSafeAreaInsets,
  onCollapse,
  onExpand,
  ...splitViewHostProps
}: SplitViewHostProps) {
  // The native split view starts expanded. It sends `onCollapse` shortly after launch when it starts in one column.
  const [isExpanded, setIsExpanded] = useState(true);
  const horizontalSafeAreaInsets =
    disableHorizontalSafeAreaInsets === undefined ? isExpanded : !disableHorizontalSafeAreaInsets;

  // Split.Host gives a column index only to direct children whose type is Split.Column.
  const columns = columnChildren.map((child) => (
    <Split.Column key={child.key}>
      {getSplitColumnChildren(child.props.children, horizontalSafeAreaInsets)}
    </Split.Column>
  ));
  const inspectors = inspectorChildren.map((child) => (
    <Split.Inspector key={child.key}>
      {getSplitColumnChildren(child.props.children, horizontalSafeAreaInsets)}
    </Split.Inspector>
  ));

  return (
    <Split.Host
      {...splitViewHostProps}
      onCollapse={(event) => {
        setIsExpanded(false);
        onCollapse?.(event);
      }}
      onExpand={(event) => {
        setIsExpanded(true);
        onExpand?.(event);
      }}>
      {columns}
      <Split.Column>
        {getSplitColumnChildren(
          <Slot activityEnabled={activityEnabled} />,
          horizontalSafeAreaInsets
        )}
      </Split.Column>
      {inspectors}
    </Split.Host>
  );
}

export const SplitView = Object.assign(SplitViewNavigator, {
  Column: SplitViewColumn,
  Inspector: SplitViewInspector,
});
