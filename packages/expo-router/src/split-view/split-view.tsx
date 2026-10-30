import React, {
  isValidElement,
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
import { Slot, SlotContent } from '../views/Navigator';
import { SplitViewContentRouter } from './SplitViewContentRouter';
import {
  getSplitColumnChildren,
  SplitViewColumn,
  SplitViewContent,
  SplitViewInspector,
  type SplitViewColumnProps,
  type SplitViewContentProps,
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
   * Disables the left and right safe area insets that SplitView applies to the content of each column and inspector.
   * @default false
   */
  disableHorizontalSafeAreaInsets?: boolean;
}

let didWarnMissingContent = false;

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

function SplitViewNavigator({
  children,
  activityEnabled,
  disableHorizontalSafeAreaInsets,
  ...splitViewHostProps
}: SplitViewProps) {
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

  const allChildrenArray = React.Children.toArray(children);
  const columnChildren = allChildrenArray.filter(
    (child): child is ReactElement<SplitViewColumnProps> =>
      isValidElement(child) && child.type === SplitViewColumn
  );
  const inspectorChildren = allChildrenArray.filter(
    (child): child is ReactElement<SplitViewColumnProps> =>
      isValidElement(child) && child.type === SplitViewInspector
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
    return (
      <SplitViewContext value={INACTIVE_SPLIT_VIEW}>
        <Slot activityEnabled={activityEnabled} />
      </SplitViewContext>
    );
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

  // Native cannot change the number of columns, so a new number of columns or inspectors mounts a new host.
  return (
    <SplitViewHost
      key={`${numberOfSidebars}-${numberOfInspectors}`}
      columnChildren={columnChildren}
      inspectorChildren={inspectorChildren}
      contentHeader={contentChildren[0]?.props.header}
      activityEnabled={activityEnabled}
      disableHorizontalSafeAreaInsets={disableHorizontalSafeAreaInsets}
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
  disableHorizontalSafeAreaInsets,
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

  // Split.Host gives a column index only to direct children whose type is Split.Column.
  const columns = columnChildren.map((child, index) => (
    <Split.Column key={child.key} {...getColumnEventProps(dispatch, columnNames[index]!)}>
      {getSplitColumnChildren(child.props, disableHorizontalSafeAreaInsets)}
    </Split.Column>
  ));
  const inspectors = inspectorChildren.map((child) => (
    <Split.Inspector key={child.key}>
      {getSplitColumnChildren(child.props, disableHorizontalSafeAreaInsets)}
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
            {/* TODO(@ubax): Replace the slot with NativeStack (ENG-28658) */}
            {getSplitColumnChildren(
              {
                children: <SplitViewContentSlot activityEnabled={activityEnabled} />,
                header: contentHeader,
              },
              disableHorizontalSafeAreaInsets
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
