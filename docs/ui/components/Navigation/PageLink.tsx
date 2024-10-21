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
        'flex items-center rounded-md px-1.5 py-2 mx-1 my-4 shadow-xs bg-default',
        'dark:bg-element'
      )}
      href={route.href}>
      <i
        className={mergeClasses(
          'shrink-0 text-icon-secondary rounded-full size-1 mr-2 invisible',
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
