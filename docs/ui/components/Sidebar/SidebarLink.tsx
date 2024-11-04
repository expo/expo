import { LinkBase, mergeClasses } from '@expo/styleguide';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import { useRouter } from 'next/compat/router';
import { useEffect, useRef, type PropsWithChildren } from 'react';

import { isRouteActive } from '~/common/routes';
import { NavigationRoute } from '~/types/common';

type SidebarLinkProps = PropsWithChildren<{
  info: NavigationRoute;
}>;

const HEAD_NAV_HEIGHT = 160;

const isLinkInViewport = (element: HTMLAnchorElement) => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top - HEAD_NAV_HEIGHT >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

export const SidebarLink = ({ info, children }: SidebarLinkProps) => {
  const router = useRouter();
  const ref = useRef<HTMLAnchorElement>(null);

  const isSelected = isRouteActive(info, router?.asPath, router?.pathname);

  useEffect(() => {
    if (isSelected && ref?.current && !isLinkInViewport(ref?.current)) {
      setTimeout(() => ref?.current && ref.current.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, []);

  if (info.hidden) {
    return null;
  }

  const customDataAttributes = isSelected && {
    'data-sidebar-anchor-selected': true,
  };
  const isExternal = info.href.startsWith('http');

  return (
    <div className="flex min-h-8 items-center p-1 pr-0">
      <LinkBase
        href={info.href as string}
        ref={ref}
        className={mergeClasses(
          'group text-xs flex decoration-0 text-secondary items-center scroll-m-[60px] w-full -ml-2.5',
          'hocus:text-link hocus:[&_svg]:text-icon-tertiary',
          isSelected && 'text-link',
          info.isDeprecated && 'line-through'
        )}
        {...customDataAttributes}>
        <div
          className={mergeClasses(
            'size-1.5 shrink-0 rounded-full my-2 mx-1.5 self-start',
            isSelected && 'bg-palette-blue11'
          )}
        />
        {children}
        {info.isNew && (
          <div
            className={mergeClasses(
              'inline-flex ml-2 -mt-px border border-palette-blue10 text-palette-white text-[11px] font-semibold rounded-full px-[5px] leading-none items-center h-[17px]',
              isSelected
                ? 'bg-palette-blue10 text-palette-white dark:text-palette-black'
                : 'bg-none border-palette-blue10 text-palette-blue10 dark:border-palette-blue9 dark:text-palette-blue9'
            )}>
            NEW
          </div>
        )}
        {isExternal && (
          <ArrowUpRightIcon className="icon-sm text-icon-secondary ml-auto group-hover:text-icon-info" />
        )}
      </LinkBase>
    </div>
  );
};
