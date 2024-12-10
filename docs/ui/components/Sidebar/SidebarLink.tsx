import { LinkBase, mergeClasses } from '@expo/styleguide';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import { useRouter } from 'next/compat/router';
import { useEffect, useRef, type PropsWithChildren } from 'react';

import { isRouteActive } from '~/common/routes';
import { NavigationRoute } from '~/types/common';

type SidebarLinkProps = PropsWithChildren<{
  info: NavigationRoute;
  className?: string;
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

export const SidebarLink = ({ info, className, children }: SidebarLinkProps) => {
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
    <LinkBase
      href={info.href as string}
      ref={ref}
      className={mergeClasses(
        'group -ml-2.5 flex w-full scroll-m-[60px] items-center p-1 pr-0 text-xs text-secondary decoration-0',
        'hocus:text-link [&_svg]:hocus:text-icon-info',
        isSelected && 'text-link [&_svg]:text-icon-info',
        info.isDeprecated && 'line-through',
        className
      )}
      {...customDataAttributes}>
      <div
        className={mergeClasses(
          'mx-1.5 my-2 size-1.5 shrink-0 self-start rounded-full',
          isSelected && 'bg-palette-blue11'
        )}
      />
      {children}
      {info.isNew && (
        <div
          className={mergeClasses(
            '-mt-px ml-2 inline-flex h-[17px] items-center rounded-full border border-palette-blue10 px-[5px] text-[11px] font-semibold leading-none text-palette-white',
            isSelected
              ? 'bg-palette-blue10 text-palette-white dark:text-palette-black'
              : 'border-palette-blue10 bg-none text-palette-blue10 dark:border-palette-blue9 dark:text-palette-blue9'
          )}>
          NEW
        </div>
      )}
      {isExternal && (
        <ArrowUpRightIcon className="icon-sm ml-auto text-icon-secondary group-hover:text-icon-info" />
      )}
    </LinkBase>
  );
};
