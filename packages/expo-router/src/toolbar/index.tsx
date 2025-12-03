import {
  ToolbarHost,
  ToolbarMenu,
  ToolbarMenuAction,
  ToolbarButton,
  ToolbarSpacer,
  ToolbarView,
} from './elements';

export const Toolbar = Object.assign(ToolbarHost, {
  Menu: ToolbarMenu,
  MenuAction: ToolbarMenuAction,
  Button: ToolbarButton,
  Spacer: ToolbarSpacer,
  View: ToolbarView,
});

export type {
  ToolbarHostProps,
  ToolbarMenuProps,
  ToolbarMenuActionProps,
  ToolbarButtonProps,
  ToolbarSpacerProps,
  ToolbarViewProps as ToolbarCustomViewProps,
} from './elements';
