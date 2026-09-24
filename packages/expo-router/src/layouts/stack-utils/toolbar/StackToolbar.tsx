import { StackToolbarButton } from './StackToolbarButton';
import StackToolbarClient from './StackToolbarClient';
import { StackToolbarMenu, StackToolbarMenuAction } from './StackToolbarMenu';
import { StackToolbarSearchBarSlot } from './StackToolbarSearchBarSlot';
import { StackToolbarSpacer } from './StackToolbarSpacer';
import { StackToolbarView } from './StackToolbarView';
import { StackToolbarBadge, StackToolbarIcon, StackToolbarLabel } from './toolbar-primitives';

// Re-attach the sub-components on the server-side reference of the client component.
// `Object.assign` (like `Stack.Screen`) keeps them resolvable by the API docs generator.
export const StackToolbar = Object.assign(StackToolbarClient, {
  Button: StackToolbarButton,
  Menu: StackToolbarMenu,
  MenuAction: StackToolbarMenuAction,
  SearchBarSlot: StackToolbarSearchBarSlot,
  Spacer: StackToolbarSpacer,
  View: StackToolbarView,
  Label: StackToolbarLabel,
  Icon: StackToolbarIcon,
  Badge: StackToolbarBadge,
});
