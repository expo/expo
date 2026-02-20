import { LinkBase, mergeClasses } from '@expo/styleguide';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import type { ComponentType, HTMLAttributes } from 'react';

import * as Tooltip from '~/ui/components/Tooltip';

type SidebarSingleEntryProps = {
  href: string;
  title: string;
  Icon: ComponentType<HTMLAttributes<SVGSVGElement>>;
  isActive?: boolean;
  isExternal?: boolean;
  secondary?: boolean;
  shouldLeakReferrer?: boolean;
  allowCompactDisplay?: boolean;
  mainSection?: string;
};

export const SidebarSingleEntry = ({
  href,
  title,
  Icon,
  isActive = false,
  isExternal = false,
  secondary = false,
  shouldLeakReferrer = false,
  allowCompactDisplay = false,
  mainSection,
}: SidebarSingleEntryProps) => {
  return (
    <Tooltip.Root delayDuration={500} disableHoverableContent>
      <Tooltip.Trigger asChild>
        <LinkBase
          href={href}
          className={mergeClasses(
            'flex min-h-[32px] items-center gap-3 rounded-md px-2 py-1 text-sm !leading-[100%] text-secondary',
            'hocus:bg-element',
            'focus-visible:relative focus-visible:z-10',
            allowCompactDisplay && 'compact-height:justify-center compact-height:bg-subtle',
            secondary && 'text-xs',
            isActive &&
              '!bg-palette-blue3 font-medium text-link hocus:!bg-palette-blue4 hocus:text-link'
          )}
          {...(shouldLeakReferrer && { target: '_blank', referrerPolicy: 'origin' })}
          {...(isActive && mainSection && { 'data-main-section': mainSection })}>
          <Icon
            className={mergeClasses(
              'shrink-0',
              secondary ? 'icon-xs' : 'icon-sm',
              isActive ? 'text-palette-blue11' : 'text-icon-tertiary'
            )}
          />
          <span className={mergeClasses(allowCompactDisplay && 'compact-height:hidden')}>
            {title}
          </span>
          {isExternal && <ArrowUpRightIcon className="icon-sm ml-auto text-icon-secondary" />}
        </LinkBase>
      </Tooltip.Trigger>
      <Tooltip.Content
        side="bottom"
        className={mergeClasses('z-50 hidden', allowCompactDisplay && 'compact-height:flex')}>
        <span className="text-2xs text-secondary">{title}</span>
      </Tooltip.Content>
    </Tooltip.Root>
  );
};
