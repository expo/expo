import { mergeClasses } from '@expo/styleguide';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import type { ReactNode } from 'react';

import { Item } from '~/ui/components/Dropdown/Item';

// note(simek): Radix Jest ESM issue workaround: https://github.com/radix-ui/primitives/issues/1848
let sanitizedRadixDropdownMenu = { default: undefined, ...DropdownMenu };
sanitizedRadixDropdownMenu = sanitizedRadixDropdownMenu.default ?? sanitizedRadixDropdownMenu;
const { Trigger, Root, Portal, Content, Arrow } = sanitizedRadixDropdownMenu;

type Props = DropdownMenu.DropdownMenuContentProps & {
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
    <Root>
      <Trigger asChild>{trigger}</Trigger>
      <Portal className="bg-danger">
        <Content
          className={mergeClasses(
            'flex min-w-[180px] flex-col gap-0.5 rounded-md border border-default bg-default p-1 shadow-md',
            'will-change-[opacity,transform] data-[side=bottom]:animate-slideUpAndFadeIn',
            className
          )}
          side={side}
          sideOffset={sideOffset}
          collisionPadding={collisionPadding}
          {...rest}>
          <Arrow asChild>
            <div className="relative -top-1 size-2.5 rotate-45 border-b border-r border-default bg-default" />
          </Arrow>
          {children}
        </Content>
      </Portal>
    </Root>
  );
}

export { Item };
