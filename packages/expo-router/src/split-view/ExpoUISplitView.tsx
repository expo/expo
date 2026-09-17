import type { ViewModifier } from '@expo/ui/swift-ui/modifiers';
import { useImperativeHandle, useState, type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type {
  SplitBehavior,
  SplitDisplayMode,
  SplitNavigableColumn,
} from 'react-native-screens/experimental';

import { StackRouter } from '../layouts/StackClient';
import { requireExpoUISwiftUI } from '../optional-libraries/expo-ui-swift-ui';
import {
  IsWithinNativeNavigator,
  unstable_createStandardRouterNavigator,
  type NavigatorContentProps,
} from '../standard-navigation';
import type { SplitViewHeaderOptions, SplitViewScreenOptions } from './elements';
import type { SplitViewImplementationProps } from './split-view';

type CompactColumn = 'sidebar' | 'content' | 'detail';
type ColumnVisibility = 'automatic' | 'all' | 'doubleColumn' | 'detailOnly';

const EXPO_UI_ERROR_MESSAGE =
  "setSplitViewImplementation('expo-ui') requires '@expo/ui'. Install it with `npx expo install @expo/ui` and rebuild your app.";

const compactColumns: Record<SplitNavigableColumn, CompactColumn> = {
  primary: 'sidebar',
  supplementary: 'content',
  secondary: 'detail',
};

// `undefined` leaves the visibility to the system, like `automatic` does in UIKit.
function columnVisibilityForDisplayMode(mode?: SplitDisplayMode): ColumnVisibility | undefined {
  switch (mode) {
    case 'secondaryOnly':
      return 'detailOnly';
    case 'oneBesideSecondary':
    case 'oneOverSecondary':
      return 'doubleColumn';
    case 'twoBesideSecondary':
    case 'twoOverSecondary':
    case 'twoDisplaceSecondary':
      return 'all';
    default:
      return undefined;
  }
}

// `balanced` shrinks the detail like UIKit tiling; `prominentDetail` keeps its size like overlay
// and displace do.
function splitViewStyleForBehavior(behavior?: SplitBehavior) {
  switch (behavior) {
    case 'tile':
      return 'balanced';
    case 'overlay':
    case 'displace':
      return 'prominentDetail';
    default:
      return 'automatic';
  }
}

// UIKit accepts fractions for preferred widths. SwiftUI needs points, so fractions are skipped.
function columnWidth(min?: number, preferred?: number, max?: number) {
  return preferred !== undefined && preferred > 1 ? { min, ideal: preferred, max } : undefined;
}

let hasWarnedAboutInspector = false;

export function ExpoUISplitView({
  ref,
  columns,
  inspectors,
  screens,
  activityEnabled,
  screenOptions,
  topColumnForCollapsing,
  preferredDisplayMode,
  preferredSplitBehavior,
  columnMetrics = {},
}: SplitViewImplementationProps) {
  const {
    expoUI: { Host, NavigationSplitView },
    modifiers: { navigationSplitViewColumnWidth, navigationSplitViewStyle },
  } = requireExpoUISwiftUI(EXPO_UI_ERROR_MESSAGE);

  if (process.env.NODE_ENV !== 'production' && !hasWarnedAboutInspector && inspectors.length) {
    hasWarnedAboutInspector = true;
    console.warn(
      'SplitView.Inspector is not supported by the expo-ui implementation and will be ignored.'
    );
  }

  // The system and `show()` change the columns too, so the props only seed the state and
  // re-seed it when they change.
  const [compactColumn, setCompactColumn] = useState<CompactColumn | undefined>(
    topColumnForCollapsing && compactColumns[topColumnForCollapsing]
  );
  const [previousTopColumn, setPreviousTopColumn] = useState(topColumnForCollapsing);
  if (previousTopColumn !== topColumnForCollapsing) {
    setPreviousTopColumn(topColumnForCollapsing);
    setCompactColumn(topColumnForCollapsing && compactColumns[topColumnForCollapsing]);
  }

  const [columnVisibility, setColumnVisibility] = useState(
    columnVisibilityForDisplayMode(preferredDisplayMode)
  );
  const [previousDisplayMode, setPreviousDisplayMode] = useState(preferredDisplayMode);
  if (previousDisplayMode !== preferredDisplayMode) {
    setPreviousDisplayMode(preferredDisplayMode);
    setColumnVisibility(columnVisibilityForDisplayMode(preferredDisplayMode));
  }

  useImperativeHandle(
    ref,
    () => ({
      show(column) {
        setCompactColumn(compactColumns[column]);
        if (column === 'primary') {
          setColumnVisibility('all');
        } else if (column === 'supplementary') {
          setColumnVisibility('doubleColumn');
        }
      },
    }),
    []
  );

  const [sidebar, content] = columns;
  const sidebarWidth = columnWidth(
    columnMetrics.minimumPrimaryColumnWidth,
    columnMetrics.preferredPrimaryColumnWidthOrFraction,
    columnMetrics.maximumPrimaryColumnWidth
  );
  const contentWidth = columnWidth(
    columnMetrics.minimumSupplementaryColumnWidth,
    columnMetrics.preferredSupplementaryColumnWidthOrFraction,
    columnMetrics.maximumSupplementaryColumnWidth
  );

  return (
    <IsWithinNativeNavigator value>
      <Host style={{ flex: 1 }}>
        <NavigationSplitView
          columnVisibility={columnVisibility}
          preferredCompactColumn={compactColumn}
          onColumnVisibilityChange={setColumnVisibility}
          onPreferredCompactColumnChange={setCompactColumn}
          modifiers={[navigationSplitViewStyle(splitViewStyleForBehavior(preferredSplitBehavior))]}>
          <NavigationSplitView.Sidebar>
            <Column
              {...sidebar}
              modifiers={sidebarWidth && [navigationSplitViewColumnWidth(sidebarWidth)]}
            />
          </NavigationSplitView.Sidebar>
          {content && (
            <NavigationSplitView.Content>
              <Column
                {...content}
                modifiers={contentWidth && [navigationSplitViewColumnWidth(contentWidth)]}
              />
            </NavigationSplitView.Content>
          )}
          <NavigationSplitView.Detail>
            <DetailNavigator activityEnabled={activityEnabled} screenOptions={screenOptions}>
              {screens}
            </DetailNavigator>
          </NavigationSplitView.Detail>
        </NavigationSplitView>
      </Host>
    </IsWithinNativeNavigator>
  );
}

function Column({
  title,
  headerShown = true,
  headerLargeTitle,
  headerBackVisible = true,
  modifiers = [],
  children,
}: SplitViewHeaderOptions & { modifiers?: ViewModifier[]; children?: ReactNode }) {
  const {
    expoUI: { RNHostView, Toolbar },
    modifiers: {
      navigationBarBackButtonHidden,
      navigationBarTitleDisplayMode,
      navigationTitle,
      toolbarVisibility,
    },
  } = requireExpoUISwiftUI(EXPO_UI_ERROR_MESSAGE);

  return (
    <Toolbar
      modifiers={[
        ...(title === undefined ? [] : [navigationTitle(title)]),
        navigationBarTitleDisplayMode(
          headerLargeTitle === undefined ? 'automatic' : headerLargeTitle ? 'large' : 'inline'
        ),
        navigationBarBackButtonHidden(!headerBackVisible),
        ...(headerShown ? [] : [toolbarVisibility('hidden')]),
        ...modifiers,
      ]}>
      <RNHostView>
        <SafeAreaProvider>{children}</SafeAreaProvider>
      </RNHostView>
    </Toolbar>
  );
}

function DetailContent({ state, descriptors }: NavigatorContentProps<SplitViewScreenOptions>) {
  const descriptor = descriptors[state.routes[state.index]?.key ?? ''];
  return descriptor ? <Column {...descriptor.options}>{descriptor.render()}</Column> : null;
}

const DetailNavigator = unstable_createStandardRouterNavigator(DetailContent, StackRouter, {
  activityDefaultThreshold: 1,
});
