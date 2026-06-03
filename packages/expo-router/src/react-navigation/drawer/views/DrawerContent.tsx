import type { DrawerContentComponentProps } from '../types';
import { DrawerContentScrollView } from './DrawerContentScrollView';
import { DrawerItemList } from './DrawerItemList';

export function DrawerContent({ descriptors, state, ...actions }: DrawerContentComponentProps) {
  const focusedRoute = state.routes[state.index]!;
  const focusedDescriptor = descriptors[focusedRoute.key]!;
  const focusedOptions = focusedDescriptor.options;

  const { drawerContentStyle, drawerContentContainerStyle } = focusedOptions;

  return (
    <DrawerContentScrollView
      contentContainerStyle={drawerContentContainerStyle}
      style={drawerContentStyle}>
      <DrawerItemList descriptors={descriptors} state={state} {...actions} />
    </DrawerContentScrollView>
  );
}
