import {
  ToolbarHost,
  ToolbarMenu,
  ToolbarMenuAction,
  ToolbarButton,
  ToolbarSpacer,
  ToolbarCustomView,
} from './elements';

export const Toolbar = Object.assign(ToolbarHost, {
  Menu: ToolbarMenu,
  MenuAction: ToolbarMenuAction,
  Button: ToolbarButton,
  Spacer: ToolbarSpacer,
  CustomView: ToolbarCustomView,
});

export type {
  ToolbarHostProps,
  ToolbarMenuProps,
  ToolbarMenuActionProps,
  ToolbarButtonProps,
  ToolbarSpacerProps,
  ToolbarCustomViewProps,
} from './elements';
