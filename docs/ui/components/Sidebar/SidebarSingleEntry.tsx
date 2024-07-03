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
        'flex items-center gap-3 text-secondary rounded-md text-sm min-h-[32px] px-2 py-1 !leading-[100%] !opacity-100',
        'hocus:bg-element',
        'focus-visible:relative focus-visible:z-10',
        secondary && 'text-xs',
        isActive && 'bg-palette-blue3 text-link font-medium hocus:text-link hocus:bg-palette-blue4'
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
      {isExternal && <ArrowUpRightIcon className="icon-sm text-icon-secondary ml-auto" />}
    </A>
  );
};
