import { LinkBase, mergeClasses } from '@expo/styleguide';
import { PlaySquareDuotoneIcon } from '@expo/styleguide-icons/duotone/PlaySquareDuotoneIcon';
import { AlertTriangleIcon } from '@expo/styleguide-icons/outline/AlertTriangleIcon';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import { PlaySquareIcon } from '@expo/styleguide-icons/outline/PlaySquareIcon';
import { AlertTriangleSolidIcon } from '@expo/styleguide-icons/solid/AlertTriangleSolidIcon';
import { useRouter } from 'next/compat/router';
import { useEffect, useRef, type PropsWithChildren } from 'react';

import { isRouteActive } from '~/common/routes';
import { NavigationRoute } from '~/types/common';

import { SidebarBadges } from './SidebarBadges';

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
    if (!isSelected || !ref?.current) {
      return;
    }
    const timeoutId = setTimeout(() => {
      if (ref?.current && !isLinkInViewport(ref.current)) {
        ref.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
    return () => {
      clearTimeout(timeoutId);
    };
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
      href={info.href}
      ref={ref}
      className={mergeClasses(
        'group -ml-2.5 flex w-full scroll-m-15 items-center p-1 pr-0 text-sm text-secondary decoration-0',
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
      {info.isDeprecated && <span className="sr-only">Deprecated</span>}
      {info.hasVideoLink && !isSelected && (
        <PlaySquareIcon className="ml-1.5 icon-xs text-icon-secondary" aria-hidden="true" />
      )}
      {info.hasVideoLink && isSelected && (
        <PlaySquareDuotoneIcon className="ml-1.5 icon-xs text-palette-blue11" aria-hidden="true" />
      )}
      {info.isDeprecated && !isSelected && (
        <AlertTriangleIcon className="ml-1.5 icon-xs text-icon-warning!" aria-hidden="true" />
      )}
      {info.isDeprecated && isSelected && (
        <AlertTriangleSolidIcon className="ml-1.5 icon-xs text-icon-warning!" aria-hidden="true" />
      )}
      <SidebarBadges info={info} isSelected={isSelected} />
      {isExternal && (
        <ArrowUpRightIcon
          aria-hidden="true"
          className="ml-auto icon-sm text-icon-secondary group-hover:text-icon-info"
        />
      )}
    </LinkBase>
  );
};
