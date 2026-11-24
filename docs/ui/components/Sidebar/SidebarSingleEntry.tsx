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
            'flex items-center rounded-lg text-sm',
            'gap-2 px-3 py-2 leading-[1.4] font-medium text-default',
            'hocus:bg-element',
            'focus-visible:relative focus-visible:z-10',
            allowCompactDisplay && 'compact-height:justify-center compact-height:bg-subtle',
            isActive && 'bg-[#e7e8ec]! dark:bg-hover! dark:hocus:bg-hover! hocus:bg-[#e7e8ec]!'
          )}
          {...(shouldLeakReferrer && { target: '_blank', referrerPolicy: 'origin' })}
          {...(isActive && mainSection && { 'data-main-section': mainSection })}>
          <Icon
            aria-hidden="true"
            className={mergeClasses('shrink-0', 'icon-sm text-icon-default')}
          />
          <span className={mergeClasses(allowCompactDisplay && 'compact-height:hidden')}>
            {title}
          </span>
          {isExternal && (
            <ArrowUpRightIcon aria-hidden="true" className="ml-auto icon-sm text-icon-secondary" />
          )}
        </LinkBase>
      </Tooltip.Trigger>
      <Tooltip.Content
        side="bottom"
        className={mergeClasses('z-50 hidden', allowCompactDisplay && 'compact-height:flex')}>
        <span className="text-xs text-secondary">{title}</span>
      </Tooltip.Content>
    </Tooltip.Root>
  );
};
