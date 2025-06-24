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
      setTimeout(() => {
        if (ref?.current) {
          ref.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
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
      href={info.href}
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
      {info.hasVideoLink && !isSelected && (
        <PlaySquareIcon className="icon-xs ml-1.5 text-icon-secondary" />
      )}
      {info.hasVideoLink && isSelected && (
        <PlaySquareDuotoneIcon className="icon-xs ml-1.5 text-palette-blue11" />
      )}
      {info.isDeprecated && !isSelected && (
        <AlertTriangleIcon className="icon-xs ml-1.5 !text-icon-warning" />
      )}
      {info.isDeprecated && isSelected && (
        <AlertTriangleSolidIcon className="icon-xs ml-1.5 !text-icon-warning" />
      )}
      {info.isNew && (
        <div
          className={mergeClasses(
            '-mt-px ml-2 inline-flex h-[17px] items-center rounded-full border border-palette-blue10 px-[5px] text-[10px] font-semibold leading-none text-palette-white',
            isSelected
              ? 'bg-palette-blue10 text-palette-white dark:text-palette-black'
              : 'border-palette-blue10 bg-none text-palette-blue10 dark:border-palette-blue9 dark:text-palette-blue9'
          )}>
          NEW
        </div>
      )}
      {info.isAlpha && (
        <div
          className={mergeClasses(
            '-mt-px ml-2 inline-flex h-[17px] items-center rounded-full border border-palette-purple10 px-[5px] text-[10px] font-semibold leading-none text-palette-white',
            isSelected
              ? 'bg-palette-purple10 text-palette-white dark:text-palette-black'
              : 'border-palette-purple10 bg-none text-palette-purple11 dark:border-palette-purple9 dark:text-palette-purple10'
          )}>
          ALPHA
        </div>
      )}
      {isExternal && (
        <ArrowUpRightIcon className="icon-sm ml-auto text-icon-secondary group-hover:text-icon-info" />
      )}
    </LinkBase>
  );
};
