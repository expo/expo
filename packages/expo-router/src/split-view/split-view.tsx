import React, {
  use,
  useImperativeHandle,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import { useRouteNode } from '../Route';
import type { SplitViewColumnName } from '../global-state/types';
import {
  Split,
  type SplitHostCommands,
  type SplitHostProps,
} from '../optional-libraries/react-native-screens';
import { getValidInitialRouteName } from '../routeNode';
import { createStandardRouterNavigator, IsWithinNativeNavigator } from '../standard-navigation';
import { useWarnOnce } from '../useDeprecated';
import { isChildOfType } from '../utils/children';
import { Slot, SlotContent } from '../views/Navigator';
import { SplitViewContentRouter } from './SplitViewContentRouter';
import {
  getSplitColumnChildren,
  SplitViewColumn,
  SplitViewContent,
  SplitViewInspector,
  type SplitViewColumnProps,
  type SplitViewHeader,
} from './elements';
import { SplitViewContext, type SplitViewState } from './useSplitView';
import { getColumnEventProps, useSplitViewColumns } from './useSplitViewColumns';

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

// Indexed by the number of SplitView.Column children.
const COLUMN_NAMES: readonly (readonly SplitViewColumnName[])[] = [
  ['secondary'],
  ['primary', 'secondary'],
  ['primary', 'supplementary', 'secondary'],
];

const INACTIVE_SPLIT_VIEW: SplitViewState = {
  show: () => {},
  isCollapsed: false,
  compactColumn: undefined,
};

const SplitViewContentSlot = createStandardRouterNavigator(SlotContent, SplitViewContentRouter, {
  activityDefaultThreshold: 1,
});

function SplitViewNavigator({ children, activityEnabled, ...splitViewHostProps }: SplitViewProps) {
  const allChildrenArray = React.Children.toArray(children);
  const columnChildren = allChildrenArray.filter((child) => isChildOfType(child, SplitViewColumn));
  const inspectorChildren = allChildrenArray.filter((child) =>
    isChildOfType(child, SplitViewInspector)
  );
  const contentChildren = allChildrenArray.filter((child) =>
    isChildOfType(child, SplitViewContent)
  );
  const numberOfSidebars = columnChildren.length;
  const numberOfInspectors = inspectorChildren.length;
  // Hooks must run before the early returns below, so the guard repeats their conditions.
  useWarnOnce(
    'SplitView.Content is missing. Add <SplitView.Content /> to SplitView to configure the content column.',
    process.env.EXPO_OS === 'ios' &&
      numberOfSidebars + numberOfInspectors > 0 &&
      contentChildren.length === 0
  );

  if (use(IsWithinNativeNavigator)) {
    throw new Error('SplitView cannot be used inside another native navigator.');
  }

  if (process.env.EXPO_OS !== 'ios') {
    console.warn(
      'SplitView is only supported on iOS. The SplitView will behave like a Slot navigator on other platforms.'
    );
    return (
      <SplitViewContext value={INACTIVE_SPLIT_VIEW}>
        <Slot activityEnabled={activityEnabled} />
      </SplitViewContext>
    );
  }

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
    return (
      <SplitViewContext value={INACTIVE_SPLIT_VIEW}>
        <Slot activityEnabled={activityEnabled} />
      </SplitViewContext>
    );
  }

  // Native cannot change the number of columns, so a new number of columns or inspectors mounts a new host.
  return (
    <SplitViewHost
      key={`${numberOfSidebars}-${numberOfInspectors}`}
      columnChildren={columnChildren}
      inspectorChildren={inspectorChildren}
      contentHeader={contentChildren[0]?.props.header}
      activityEnabled={activityEnabled}
      {...splitViewHostProps}
    />
  );
}

interface SplitViewHostProps extends Omit<SplitViewProps, 'children'> {
  columnChildren: ReactElement<SplitViewColumnProps>[];
  inspectorChildren: ReactElement<SplitViewColumnProps>[];
  contentHeader: SplitViewHeader | undefined;
}

function SplitViewHost({
  columnChildren,
  inspectorChildren,
  contentHeader,
  activityEnabled,
  horizontalSafeAreaInsets = 'expanded',
  ref,
  topColumnForCollapsing,
  onCollapse,
  onExpand,
  ...splitViewHostProps
}: SplitViewHostProps) {
  useAnchorWarning();
  const columnNames = COLUMN_NAMES[columnChildren.length]!;
  const [host, setHost] = useState<SplitHostCommands | null>(null);
  useImperativeHandle(ref, () => ({ show: (column) => host?.show(column) }), [host]);
  const { context, dispatch } = useSplitViewColumns(columnNames, topColumnForCollapsing, host);
  // The native split view starts expanded. It sends `onCollapse` after mount when it starts in one column.
  // TODO(ENG-28941): Get this value from react-native-screens.
  const applyHorizontalInsets =
    horizontalSafeAreaInsets === 'always' ||
    (horizontalSafeAreaInsets === 'expanded' && !context.isCollapsed);

  // Split.Host gives a column index only to direct children whose type is Split.Column.
  const columns = columnChildren.map((child, index) => (
    <Split.Column key={child.key} {...getColumnEventProps(dispatch, columnNames[index]!)}>
      {getSplitColumnChildren(child.props, applyHorizontalInsets)}
    </Split.Column>
  ));
  const inspectors = inspectorChildren.map((child) => (
    <Split.Inspector key={child.key}>
      {getSplitColumnChildren(child.props, applyHorizontalInsets)}
    </Split.Inspector>
  ));

  return (
    <IsWithinNativeNavigator value>
      <SplitViewContext value={context}>
        <Split.Host
          ref={setHost}
          {...splitViewHostProps}
          topColumnForCollapsing={context.compactColumn}
          onCollapse={(event) => {
            dispatch({ type: 'collapse' });
            onCollapse?.(event);
          }}
          onExpand={(event) => {
            dispatch({ type: 'expand' });
            onExpand?.(event);
          }}>
          {columns}
          <Split.Column {...getColumnEventProps(dispatch, 'secondary')}>
            {getSplitColumnChildren(
              {
                children: <SplitViewContentSlot activityEnabled={activityEnabled} />,
                header: contentHeader,
              },
              applyHorizontalInsets
            )}
          </Split.Column>
          {inspectors}
        </Split.Host>
      </SplitViewContext>
    </IsWithinNativeNavigator>
  );
}

function useAnchorWarning() {
  const routeNode = useRouteNode();
  const anchor = getValidInitialRouteName(routeNode);
  useWarnOnce(
    `The SplitView layout at "${routeNode?.contextKey}" sets the anchor "${anchor}", but SplitView keeps only the current route on iOS. The anchor applies only to the first navigation. Remove the anchor.`,
    anchor !== undefined
  );
}

export const SplitView = Object.assign(SplitViewNavigator, {
  Column: SplitViewColumn,
  Content: SplitViewContent,
  Inspector: SplitViewInspector,
});
