import { nanoid } from 'nanoid/non-secure';
import { useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import { RouterToolbarHost, RouterToolbarItem } from './native';
import type { RouterToolbarHostProps, RouterToolbarItemProps } from './native.types';
import { InternalLinkPreviewContext } from '../link/InternalLinkPreviewContext';
import {
  LinkMenu,
  LinkMenuAction,
  type LinkMenuActionProps,
  type LinkMenuProps,
} from '../link/elements';

export type ToolbarMenuProps = LinkMenuProps;
export const ToolbarMenu = LinkMenu;

export type ToolbarMenuActionProps = LinkMenuActionProps;
export const ToolbarMenuAction = LinkMenuAction;

export interface ToolbarButtonProps
  extends Pick<
    RouterToolbarItemProps,
    | 'barButtonItemStyle'
    | 'hidden'
    | 'selected'
    | 'possibleTitles'
    | 'tintColor'
    | 'hidesSharedBackground'
    | 'sharesBackground'
  > {
  children?: string;
  sf?: SFSymbol;
  onPress?: () => void;
}
export const ToolbarButton = ({ children, sf, onPress, ...rest }: ToolbarButtonProps) => {
  const id = useMemo(() => nanoid(), []);
  return (
    <RouterToolbarItem
      {...rest}
      onSelected={onPress}
      identifier={id}
      title={children}
      systemImageName={sf}
    />
  );
};

export type ToolbarSpacerProps = Pick<RouterToolbarItemProps, 'width' | 'hidden'>;
export const ToolbarSpacer = ({ width, ...rest }: ToolbarSpacerProps) => {
  const id = useMemo(() => nanoid(), []);
  return (
    <RouterToolbarItem
      {...rest}
      identifier={id}
      type={width ? 'fixedSpacer' : 'fluidSpacer'}
      width={width}
    />
  );
};

export interface ToolbarCustomViewProps
  extends Pick<RouterToolbarItemProps, 'hidesSharedBackground' | 'sharesBackground'> {
  children: React.ReactNode;
  style?: StyleProp<
    Omit<ViewStyle, 'position' | 'inset' | 'top' | 'left' | 'right' | 'bottom' | 'flex'>
  >;
}
export const ToolbarCustomView = ({ children, style, ...rest }: ToolbarCustomViewProps) => {
  const id = useMemo(() => nanoid(), []);
  return (
    <RouterToolbarItem {...rest} identifier={id}>
      <View style={[style, { position: 'absolute' }]}>{children}</View>
    </RouterToolbarItem>
  );
};

export type ToolbarHostProps = RouterToolbarHostProps;
export const ToolbarHost = (props: ToolbarHostProps) => {
  // TODO: Replace InternalLinkPreviewContext with a more generic context
  return (
    <InternalLinkPreviewContext value={{ isVisible: false, href: '' }}>
      <RouterToolbarHost {...props} />
    </InternalLinkPreviewContext>
  );
};
