import type { ViewModifier } from '@expo/ui/swift-ui/modifiers';
import { Children, isValidElement, useImperativeHandle, useState, type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type {
  SplitBehavior,
  SplitDisplayMode,
  SplitNavigableColumn,
} from 'react-native-screens/experimental';

import { requireExpoUISwiftUI } from '../optional-libraries/expo-ui-swift-ui';
import { IsWithinNativeNavigator } from '../standard-navigation';
import { isChildOfType } from '../utils/children';
import { StackToolbarButton } from '../layouts/stack-utils/toolbar/StackToolbarButton';
import { convertStackHeaderSharedPropsToRNSharedHeaderItem } from '../layouts/stack-utils/toolbar/shared';
import {
  ExpoUISplitViewToolbarProvider,
  useExpoUISplitViewToolbarState,
} from './ExpoUISplitViewToolbar';
import type { SplitViewHeaderOptions } from './elements';
import type { ExpoUISplitViewHostProps, SplitViewImplementationProps } from './split-view';

type CompactColumn = 'sidebar' | 'content' | 'detail';
type ColumnVisibility = 'automatic' | 'all' | 'doubleColumn' | 'detailOnly';

const EXPO_UI_ERROR_MESSAGE =
  'SplitView implementation="expo-ui" requires \'@expo/ui\'. Install it with `npx expo install @expo/ui` and rebuild your app.';

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

function columnWidth(min?: number, preferred?: number, max?: number) {
  const ideal = preferred ?? min ?? max;
  return ideal === undefined ? undefined : { min, ideal, max };
}

let hasWarnedAboutInspector = false;

export function ExpoUISplitView({
  ...props
}: SplitViewImplementationProps & ExpoUISplitViewHostProps) {
  return (
    <ExpoUISplitViewToolbarProvider>
      <ExpoUISplitViewContent {...props} />
    </ExpoUISplitViewToolbarProvider>
  );
}

function ExpoUISplitViewContent({
  ref,
  columns,
  inspectors,
  main,
  topColumnForCollapsing,
  preferredDisplayMode,
  preferredSplitBehavior,
  columnMetrics = {},
}: SplitViewImplementationProps & ExpoUISplitViewHostProps) {
  const {
    expoUI: { Host, NavigationSplitView, RNHostView, Toolbar, ToolbarItem },
    modifiers: {
      navigationBarTitleDisplayMode,
      navigationSplitViewColumnWidth,
      navigationSplitViewStyle,
      navigationTitle,
    },
  } = requireExpoUISwiftUI(EXPO_UI_ERROR_MESSAGE);
  const toolbar = useExpoUISplitViewToolbarState();

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
        } else {
          setColumnVisibility('detailOnly');
        }
      },
    }),
    []
  );

  const [sidebar, content] = columns;
  const sidebarWidth = columnWidth(
    columnMetrics.minimumPrimaryColumnWidth,
    columnMetrics.preferredPrimaryColumnWidth,
    columnMetrics.maximumPrimaryColumnWidth
  );
  const contentWidth = columnWidth(
    columnMetrics.minimumSupplementaryColumnWidth,
    columnMetrics.preferredSupplementaryColumnWidth,
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
            <Toolbar
              modifiers={[
                ...(typeof toolbar?.title?.children === 'string'
                  ? [navigationTitle(toolbar.title.children)]
                  : []),
                navigationBarTitleDisplayMode(toolbar?.title?.large ? 'large' : 'inline'),
              ]}>
              <RNHostView>{main}</RNHostView>
              <Toolbar.Content>
                {renderToolbarButtons(toolbar?.left?.children, 'topBarLeading', ToolbarItem)}
                {renderToolbarButtons(toolbar?.right?.children, 'topBarTrailing', ToolbarItem)}
              </Toolbar.Content>
            </Toolbar>
          </NavigationSplitView.Detail>
        </NavigationSplitView>
      </Host>
    </IsWithinNativeNavigator>
  );
}

function renderToolbarButtons(
  children: ReactNode,
  placement: 'topBarLeading' | 'topBarTrailing',
  ToolbarItem: ReturnType<typeof requireExpoUISwiftUI>['expoUI']['ToolbarItem']
) {
  const {
    expoUI: { Button },
  } = requireExpoUISwiftUI(EXPO_UI_ERROR_MESSAGE);
  return Children.toArray(children).map((child, index) => {
    if (!isValidElement(child) || !isChildOfType(child, StackToolbarButton) || child.props.hidden) {
      return null;
    }
    const item = convertStackHeaderSharedPropsToRNSharedHeaderItem(child.props);
    const systemImage = item.icon?.type === 'sfSymbol' ? item.icon.name : undefined;
    return (
      <ToolbarItem key={child.key ?? index} placement={placement}>
        <Button
          label={item.label || item.accessibilityLabel}
          onPress={child.props.onPress}
          systemImage={systemImage}
        />
      </ToolbarItem>
    );
  });
}

function Column({
  title,
  headerLargeTitle,
  modifiers = [],
  children,
}: SplitViewHeaderOptions & { modifiers?: ViewModifier[]; children?: ReactNode }) {
  const {
    expoUI: { RNHostView, Toolbar },
    modifiers: { navigationBarTitleDisplayMode, navigationTitle },
  } = requireExpoUISwiftUI(EXPO_UI_ERROR_MESSAGE);

  return (
    <Toolbar
      modifiers={[
        ...(title === undefined ? [] : [navigationTitle(title)]),
        navigationBarTitleDisplayMode(
          headerLargeTitle === undefined ? 'automatic' : headerLargeTitle ? 'large' : 'inline'
        ),
        ...modifiers,
      ]}>
      <RNHostView>
        <SafeAreaProvider>{children}</SafeAreaProvider>
      </RNHostView>
    </Toolbar>
  );
}
