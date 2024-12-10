import { mergeClasses } from '@expo/styleguide';

import { NavigationRenderProps } from './types';

import { A, CALLOUT } from '~/ui/components/Text';

export function PageLink({ route, isActive }: NavigationRenderProps) {
  if (route.type !== 'page') {
    throw new Error(`Navigation route is not a page`);
  }

  return (
    <A
      className={mergeClasses(
        'mx-1 my-4 flex items-center rounded-md bg-default px-1.5 py-2 shadow-xs',
        'dark:bg-element'
      )}
      href={route.href}>
      <i
        className={mergeClasses(
          'invisible mr-2 size-1 shrink-0 rounded-full text-icon-secondary',
          isActive && 'visible'
        )}
      />
      <CALLOUT
        className={mergeClasses('text-secondary', isActive && 'font-medium text-default')}
        tag="span">
        {route.sidebarTitle || route.name}
      </CALLOUT>
    </A>
  );
}
