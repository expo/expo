import { mergeClasses } from '@expo/styleguide';
import { ArrowUpRightIcon } from '@expo/styleguide-icons';
import type { ComponentType, HTMLAttributes } from 'react';

import { A } from '../Text';

type SidebarSingleEntryProps = {
  href: string;
  title: string;
  Icon: ComponentType<HTMLAttributes<SVGSVGElement>>;
  isActive?: boolean;
  isExternal?: boolean;
  secondary?: boolean;
};

export const SidebarSingleEntry = ({
  href,
  title,
  Icon,
  isActive = false,
  isExternal = false,
  secondary = false,
}: SidebarSingleEntryProps) => {
  return (
    <A
      href={href}
      className={mergeClasses(
        'flex items-center gap-3 text-secondary rounded-md text-xs min-h-[32px] px-2 py-1 !leading-[100%] !opacity-100',
        'hocus:bg-element',
        secondary && 'text-xs',
        isActive && 'bg-palette-blue3 text-link font-medium hocus:text-link hocus:bg-palette-blue4'
      )}
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
