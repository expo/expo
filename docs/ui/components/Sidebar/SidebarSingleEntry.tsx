import { mergeClasses } from '@expo/styleguide';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import type { ComponentType, HTMLAttributes } from 'react';

import { A } from '../Text';

type SidebarSingleEntryProps = {
  href: string;
  title: string;
  Icon: ComponentType<HTMLAttributes<SVGSVGElement>>;
  isActive?: boolean;
  isExternal?: boolean;
  secondary?: boolean;
  shouldLeakReferrer?: boolean;
};

export const SidebarSingleEntry = ({
  href,
  title,
  Icon,
  isActive = false,
  isExternal = false,
  secondary = false,
  shouldLeakReferrer,
}: SidebarSingleEntryProps) => {
  return (
    <A
      href={href}
      className={mergeClasses(
        'flex min-h-[32px] items-center gap-3 rounded-md px-2 py-1 text-sm !leading-[100%] text-secondary !opacity-100',
        'hocus:bg-element',
        'focus-visible:relative focus-visible:z-10',
        secondary && 'text-xs',
        isActive && 'bg-palette-blue3 font-medium text-link hocus:bg-palette-blue4 hocus:text-link'
      )}
      shouldLeakReferrer={shouldLeakReferrer}
      isStyled>
      <Icon
        className={mergeClasses(
          secondary ? 'icon-xs' : 'icon-sm',
          isActive ? 'text-palette-blue11' : 'text-icon-tertiary'
        )}
      />
      {title}
      {isExternal && <ArrowUpRightIcon className="icon-sm ml-auto text-icon-secondary" />}
    </A>
  );
};
