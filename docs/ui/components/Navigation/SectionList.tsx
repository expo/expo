import { mergeClasses } from '@expo/styleguide';
import { ChevronDownIcon } from '@expo/styleguide-icons/outline/ChevronDownIcon';
import type { PropsWithChildren } from 'react';

import { Collapsible } from '~/ui/components/Collapsible';
import { CALLOUT } from '~/ui/components/Text';

import { NavigationRenderProps } from './types';

type SectionListProps = PropsWithChildren<NavigationRenderProps>;

export function SectionList({ route, isActive, children }: SectionListProps) {
  if (route.type !== 'section') {
    throw new Error(`Navigation route is not a section`);
  }

  return (
    <Collapsible
      className="mb-3 pt-3"
      open={isActive ?? route.expanded}
      summary={
        <div className="mx-4 flex items-center select-none">
          <ChevronDownIcon
            className={mergeClasses(
              'icon-sm text-icon-default shrink-0 -rotate-90 transition-transform duration-150',
              '[details[open]>summary_&]:rotate-0'
            )}
          />
          <CALLOUT className="p-1.5 font-medium" tag="span">
            {route.name}
          </CALLOUT>
        </div>
      }>
      {children}
    </Collapsible>
  );
}
