import type { ReactNode, Ref } from 'react';
import type { NativeSyntheticEvent, ViewProps } from 'react-native';

type EmptyEvent = Readonly<NonNullable<unknown>>;

type DisplayModeWillChangeEvent = {
  currentDisplayMode: string;
  nextDisplayMode: string;
};

type SplitDisplayModeButtonVisibility = 'always' | 'automatic' | 'never';
type SplitBehavior = 'automatic' | 'displace' | 'overlay' | 'tile';
type SplitPrimaryEdge = 'leading' | 'trailing';
type SplitPrimaryBackgroundStyle = 'default' | 'none' | 'sidebar';
type SplitDisplayMode =
  | 'automatic'
  | 'secondaryOnly'
  | 'oneBesideSecondary'
  | 'oneOverSecondary'
  | 'twoBesideSecondary'
  | 'twoOverSecondary'
  | 'twoDisplaceSecondary';
type SplitHostOrientation =
  | 'inherit'
  | 'all'
  | 'allButUpsideDown'
  | 'portrait'
  | 'portraitUp'
  | 'portraitDown'
  | 'landscape'
  | 'landscapeLeft'
  | 'landscapeRight';
type SplitHostColorScheme = 'inherit' | 'light' | 'dark';

type SplitColumnMetrics = {
  minimumPrimaryColumnWidth?: number;
  maximumPrimaryColumnWidth?: number;
  preferredPrimaryColumnWidthOrFraction?: number;
  minimumSupplementaryColumnWidth?: number;
  maximumSupplementaryColumnWidth?: number;
  preferredSupplementaryColumnWidthOrFraction?: number;
  minimumSecondaryColumnWidth?: number;
  preferredSecondaryColumnWidthOrFraction?: number;
  minimumInspectorColumnWidth?: number;
  maximumInspectorColumnWidth?: number;
  preferredInspectorColumnWidthOrFraction?: number;
};

type SplitNavigableColumn = 'primary' | 'supplementary' | 'secondary';

type SplitHostCommands = {
  show: (column: SplitNavigableColumn) => void;
};

/**
 * Props supported by the native split view host.
 */
export interface SplitHostProps extends ViewProps {
  children: NonNullable<ReactNode>;
  ref?: Ref<SplitHostCommands>;
  columnMetrics?: SplitColumnMetrics;
  displayModeButtonVisibility?: SplitDisplayModeButtonVisibility;
  onCollapse?: (event: NativeSyntheticEvent<EmptyEvent>) => void;
  onDisplayModeWillChange?: (event: NativeSyntheticEvent<DisplayModeWillChangeEvent>) => void;
  onExpand?: (event: NativeSyntheticEvent<EmptyEvent>) => void;
  onInspectorHide?: (event: NativeSyntheticEvent<EmptyEvent>) => void;
  orientation?: SplitHostOrientation;
  colorScheme?: SplitHostColorScheme;
  presentsWithGesture?: boolean;
  preferredDisplayMode?: SplitDisplayMode;
  preferredSplitBehavior?: SplitBehavior;
  primaryBackgroundStyle?: SplitPrimaryBackgroundStyle;
  primaryEdge?: SplitPrimaryEdge;
  showInspector?: boolean;
  showSecondaryToggleButton?: boolean;
  topColumnForCollapsing?: SplitNavigableColumn;
}
