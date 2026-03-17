import type { PropsWithChildren } from 'react';

import { CALLOUT } from '~/ui/components/Text';

import { NavigationRenderProps } from './types';

type GroupListProps = PropsWithChildren<NavigationRenderProps>;

export function GroupList({ route, children }: GroupListProps) {
  if (route.type !== 'group') {
    throw new Error(`Navigation route is not a group`);
  }

  return (
    <>
      <CALLOUT className="border-default mb-2 ml-4 border-b p-1 pl-[5.5] font-semibold">
        {route.name}
      </CALLOUT>
      {children}
    </>
  );
}
