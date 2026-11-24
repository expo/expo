import { mergeClasses } from '@expo/styleguide';
import * as RawRadixDropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import type { ReactNode } from 'react';

import { Item } from '~/ui/components/Dropdown/Item';

// note(simek): Radix Jest ESM issue workaround: https://github.com/radix-ui/primitives/issues/1848
let RadixDropdownMenuPrimitive = { default: undefined, ...RawRadixDropdownMenuPrimitive };
RadixDropdownMenuPrimitive = RadixDropdownMenuPrimitive.default ?? RadixDropdownMenuPrimitive;
const { Trigger, Root, Portal, Content } = RadixDropdownMenuPrimitive;

type Props = RawRadixDropdownMenuPrimitive.DropdownMenuContentProps & {
  trigger: ReactNode;
};

export function Dropdown({
  children,
  trigger,
  className,
  sideOffset = 0,
  collisionPadding = { left: 16, right: 16 },
  side = 'bottom',
  align = 'end',
  ...rest
}: Props) {
  return (
    <Root modal={false}>
      <Trigger asChild>{trigger}</Trigger>
      <Portal>
        <Content
          className={mergeClasses(
            'flex min-w-50 flex-col gap-1 rounded-lg border-0.5 border-default bg-default p-[3.5px] shadow-sm',
            'will-change-[opacity,transform] data-[side=bottom]:animate-slideUpAndFadeIn',
            className
          )}
          side={side}
          align={align}
          sideOffset={sideOffset}
          collisionPadding={collisionPadding}
          {...rest}>
          {children}
        </Content>
      </Portal>
    </Root>
  );
}

export { Item };
