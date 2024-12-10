import type { PropsWithChildren } from 'react';

import { NavigationRenderProps } from '.';

import { CALLOUT } from '~/ui/components/Text';

type GroupListProps = PropsWithChildren<NavigationRenderProps>;

export function GroupList({ route, children }: GroupListProps) {
  if (route.type !== 'group') {
    throw new Error(`Navigation route is not a group`);
  }

  return (
    <>
      <CALLOUT className="mb-2 ml-4 border-b border-default p-1 pl-[5.5] font-semibold">
        {route.name}
      </CALLOUT>
      {children}
    </>
  );
}
