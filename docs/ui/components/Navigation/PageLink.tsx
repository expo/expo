import { mergeClasses } from '@expo/styleguide';

import { A, CALLOUT } from '~/ui/components/Text';

import { NavigationRenderProps } from './types';

export function PageLink({ route, isActive }: NavigationRenderProps) {
  if (route.type !== 'page') {
    throw new Error(`Navigation route is not a page`);
  }

  return (
    <A
      className={mergeClasses(
        'bg-default mx-1 my-4 flex items-center rounded-md px-1.5 py-2 shadow-xs',
        'dark:bg-element'
      )}
      href={route.href}>
      <i
        className={mergeClasses(
          'text-icon-secondary invisible mr-2 size-1 shrink-0 rounded-full',
          isActive && 'visible'
        )}
      />
      <CALLOUT
        className={mergeClasses('text-secondary', isActive && 'text-default font-medium')}
        tag="span">
        {route.sidebarTitle ?? route.name}
      </CALLOUT>
    </A>
  );
}
