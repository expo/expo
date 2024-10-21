import { mergeClasses } from '@expo/styleguide';
import { ChevronDownIcon } from '@expo/styleguide-icons/outline/ChevronDownIcon';
import type { PropsWithChildren } from 'react';

import { NavigationRenderProps } from '.';

import { Collapsible } from '~/ui/components/Collapsible';
import { CALLOUT } from '~/ui/components/Text';

type SectionListProps = PropsWithChildren<NavigationRenderProps>;

export function SectionList({ route, isActive, children }: SectionListProps) {
  if (route.type !== 'section') {
    throw new Error(`Navigation route is not a section`);
  }

  return (
    <Collapsible
      className="pt-3 mb-3"
      open={isActive || route.expanded}
      summary={
        <div className="flex items-center select-none mx-4">
          <ChevronDownIcon
            className={mergeClasses(
              'icon-sm text-icon-default shrink-0 -rotate-90 transition-transform duration-150',
              '[details[open]>summary_&]:rotate-0'
            )}
          />
          <CALLOUT className="font-medium p-1.5" tag="span">
            {route.name}
          </CALLOUT>
        </div>
      }>
      {children}
    </Collapsible>
  );
}
