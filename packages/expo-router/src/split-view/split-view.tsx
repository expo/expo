import React, { isValidElement, use, type ReactElement, type ReactNode } from 'react';

import { Split, type SplitHostProps } from '../optional-libraries/react-native-screens';
import { IsWithinNativeNavigator } from '../standard-navigation';
import { Slot } from '../views/Navigator';
import {
  getSplitColumnChildren,
  SplitViewColumn,
  SplitViewInspector,
  type SplitViewColumnProps,
} from './elements';
import { SplitViewColumnOptionsView } from './native';
import type { SplitViewColumnOptions } from './native.types';

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
   * Options for the navigation bar of the detail column.
   *
   * When `showSecondaryToggleButton` changes, the navigation bar of the detail column can show
   * without these options for one frame.
   * @platform ios
   */
  detailOptions?: SplitViewColumnOptions;
}

function SplitViewNavigator({
  children,
  activityEnabled,
  detailOptions,
  ...splitViewHostProps
}: SplitViewProps) {
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
    (child) => isValidElement(child) && child.type === SplitViewInspector
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

  // In compact width, the columns share one navigation bar. Every column needs an options view,
  // so the bar follows the column on top, also when that column has no options.
  const hasOptions =
    detailOptions !== undefined || columnChildren.some((child) => child.props.options);
  const emptyOptions = hasOptions ? {} : undefined;

  // Split.Host gives a column index only to direct children whose type is Split.Column.
  const columns = columnChildren.map((child) => (
    <Split.Column key={child.key}>
      {getSplitColumnChildren(child.props.children, child.props.options ?? emptyOptions)}
    </Split.Column>
  ));

  // The key is needed, because number of columns cannot be changed dynamically
  return (
    <IsWithinNativeNavigator value>
      <Split.Host key={numberOfSidebars + numberOfInspectors} {...splitViewHostProps}>
        {columns}
        <Split.Column>
          {hasOptions && (
            <SplitViewColumnOptionsView
              {...detailOptions}
              showSecondaryToggleButton={splitViewHostProps.showSecondaryToggleButton}
            />
          )}
          <Slot activityEnabled={activityEnabled} />
        </Split.Column>
        {inspectorChildren}
      </Split.Host>
    </IsWithinNativeNavigator>
  );
}

export const SplitView = Object.assign(SplitViewNavigator, {
  Column: SplitViewColumn,
  Inspector: SplitViewInspector,
});
