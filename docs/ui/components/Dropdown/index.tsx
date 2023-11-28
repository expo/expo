import { mergeClasses } from '@expo/styleguide';
import DropdownMenu from '@radix-ui/react-dropdown-menu';
import type { ReactNode } from 'react';

import { Item } from '~/ui/components/Dropdown/Item';

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
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal className="bg-danger">
        <DropdownMenu.Content
          className={mergeClasses(
            'flex min-w-[180px] flex-col gap-0.5 rounded-md border border-default bg-default p-1 shadow-md',
            'will-change-[opacity,transform] data-[side=bottom]:animate-slideUpAndFadeIn',
            className
          )}
          side={side}
          sideOffset={sideOffset}
          collisionPadding={collisionPadding}
          {...rest}>
          <DropdownMenu.Arrow asChild>
            <div className="relative -top-1 h-2.5 w-2.5 rotate-45 border-b border-r border-default bg-default" />
          </DropdownMenu.Arrow>
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export { Item };
