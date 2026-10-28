import React, { isValidElement, use, useState, type ReactElement, type ReactNode } from 'react';

import { Split, type SplitHostProps } from '../optional-libraries/react-native-screens';
import { IsWithinNativeNavigator } from '../standard-navigation';
import { isChildOfType } from '../utils/children';
import { Slot } from '../views/Navigator';
import {
  getSplitColumnChildren,
  SplitViewColumn,
  SplitViewContent,
  SplitViewInspector,
  type SplitViewContentProps,
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
  /**
   * When SplitView applies the left and right safe area insets to the content of each column and inspector.
   * - `'expanded'`: only while the split view shows more than one column.
   * - `'always'`: in all modes.
   * - `'never'`: never. Apply the insets yourself, for example with `SafeAreaView` from `react-native-screens/experimental`.
   *   Otherwise, the content can show under the sidebar.
   * @default 'expanded'
   */
  horizontalSafeAreaInsets?: 'expanded' | 'always' | 'never';
}

let didWarnMissingContent = false;

function SplitViewNavigator({
  children,
  activityEnabled,
  horizontalSafeAreaInsets = 'expanded',
  onCollapse,
  onExpand,
  ...splitViewHostProps
}: SplitViewProps) {
  // The native split view starts expanded. It sends `onCollapse` after mount when it starts in one column.
  // TODO(ENG-28941): Get this value from react-native-screens.
  const [isExpanded, setIsExpanded] = useState(true);
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
  const columnChildren = allChildrenArray.filter((child) => isChildOfType(child, SplitViewColumn));
  const inspectorChildren = allChildrenArray.filter((child) =>
    isChildOfType(child, SplitViewInspector)
  );
  const contentChildren = allChildrenArray.filter(
    (child): child is ReactElement<SplitViewContentProps> =>
      isValidElement(child) && child.type === SplitViewContent
  );
  const numberOfSidebars = columnChildren.length;
  const numberOfInspectors = inspectorChildren.length;

  if (
    allChildrenArray.length !==
    columnChildren.length + inspectorChildren.length + contentChildren.length
  ) {
    console.warn(
      'Only SplitView.Column, SplitView.Content and SplitView.Inspector components are allowed as direct children of SplitView.'
    );
  }

  if (numberOfSidebars > 2) {
    throw new Error('There can only be two SplitView.Column in the SplitView.');
  }

  if (contentChildren.length > 1) {
    throw new Error('There can only be one SplitView.Content in the SplitView.');
  }

  if (numberOfSidebars + numberOfInspectors === 0) {
    console.warn('No SplitView.Column and SplitView.Inspector found in SplitView.');
    return <Slot activityEnabled={activityEnabled} />;
  }

  if (
    process.env.NODE_ENV !== 'production' &&
    contentChildren.length === 0 &&
    !didWarnMissingContent
  ) {
    didWarnMissingContent = true;
    console.warn(
      'SplitView.Content is missing. Add <SplitView.Content /> to SplitView to configure the content column.'
    );
  }

  const applyHorizontalInsets =
    horizontalSafeAreaInsets === 'always' ||
    (horizontalSafeAreaInsets === 'expanded' && isExpanded);

  // Split.Host gives a column index only to direct children whose type is Split.Column.
  const columns = columnChildren.map((child) => (
    <Split.Column key={child.key}>
      {getSplitColumnChildren(child.props, applyHorizontalInsets)}
    </Split.Column>
  ));
  const inspectors = inspectorChildren.map((child) => (
    <Split.Inspector key={child.key}>
      {getSplitColumnChildren(child.props, applyHorizontalInsets)}
    </Split.Inspector>
  ));
  const contentHeader = contentChildren[0]?.props.header;

  // The key is needed, because number of columns cannot be changed dynamically
  return (
    <IsWithinNativeNavigator value>
      <Split.Host
        key={numberOfSidebars + numberOfInspectors}
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
          {/* TODO(@ubax): Replace Slot with NativeStack (ENG-28658) */}
          {getSplitColumnChildren(
            { children: <Slot activityEnabled={activityEnabled} />, header: contentHeader },
            applyHorizontalInsets
          )}
        </Split.Column>
        {inspectors}
      </Split.Host>
    </IsWithinNativeNavigator>
  );
}

export const SplitView = Object.assign(SplitViewNavigator, {
  Column: SplitViewColumn,
  Content: SplitViewContent,
  Inspector: SplitViewInspector,
});
