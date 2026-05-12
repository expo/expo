import { mergeClasses } from '@expo/styleguide';
import * as RawRadixDropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import type { ReactNode } from 'react';

import { Item } from '~/ui/components/Dropdown/Item';

// note(simek): Radix Jest ESM issue workaround: https://github.com/radix-ui/primitives/issues/1848
let RadixDropdownMenuPrimitive = { default: undefined, ...RawRadixDropdownMenuPrimitive };
RadixDropdownMenuPrimitive = RadixDropdownMenuPrimitive.default ?? RadixDropdownMenuPrimitive;
const { Trigger, Root, Portal, Content, Arrow } = RadixDropdownMenuPrimitive;

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
  ...rest
}: Props) {
  return (
    <Root modal={false}>
      <Trigger asChild>{trigger}</Trigger>
      <Portal>
        <div className="bg-danger">
          <Content
            className={mergeClasses(
              'border-default bg-default flex min-w-[180px] flex-col gap-0.5 rounded-md border p-1 shadow-md',
              'data-[side=bottom]:animate-slideUpAndFadeIn will-change-[opacity,transform]',
              className
            )}
            side={side}
            sideOffset={sideOffset}
            collisionPadding={collisionPadding}
            {...rest}>
            <Arrow asChild>
              <div className="border-default bg-default relative -top-1 size-2.5 rotate-45 border-r border-b" />
            </Arrow>
            {children}
          </Content>
        </div>
      </Portal>
    </Root>
  );
}

export { Item };
