import { LinkBase, mergeClasses } from '@expo/styleguide';
import { PlaySquareDuotoneIcon } from '@expo/styleguide-icons/duotone/PlaySquareDuotoneIcon';
import { AlertTriangleIcon } from '@expo/styleguide-icons/outline/AlertTriangleIcon';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import { PlaySquareIcon } from '@expo/styleguide-icons/outline/PlaySquareIcon';
import { useRouter } from 'next/compat/router';
import { useEffect, useRef, type PropsWithChildren } from 'react';

import { isRouteActive } from '~/common/routes';
import { NavigationRoute } from '~/types/common';

type SidebarLinkProps = PropsWithChildren<{
  info: NavigationRoute;
  className?: string;
}>;

const HEAD_NAV_HEIGHT = 160;

const BADGE_CLASS_NAME =
  'inline-flex shrink-0 items-center rounded-full border px-[5px] py-0.5 text-[10px] leading-none font-semibold';

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
        'flex w-full scroll-m-15 items-center gap-2 rounded-lg px-(--sidebar-entry-px,12px) py-2 text-sm leading-[1.4] font-medium text-default decoration-0',
        'hocus:bg-element',
        isSelected && 'bg-selected hocus:bg-selected',
        info.isDeprecated && 'line-through',
        className
      )}
      {...customDataAttributes}>
      {children}
      {info.isDeprecated && <span className="sr-only">Deprecated</span>}
      {info.hasVideoLink && !isSelected && (
        <PlaySquareIcon className="icon-sm shrink-0 text-icon-secondary" aria-hidden="true" />
      )}
      {info.hasVideoLink && isSelected && (
        <PlaySquareDuotoneIcon
          className="icon-sm shrink-0 text-palette-blue11"
          aria-hidden="true"
        />
      )}
      {info.isDeprecated && (
        <AlertTriangleIcon
          className="icon-md shrink-0 text-[#ad6200] dark:text-icon-warning"
          aria-hidden="true"
        />
      )}
      {info.isNew && (
        <div
          className={mergeClasses(
            BADGE_CLASS_NAME,
            isSelected
              ? 'border-palette-blue11 bg-palette-blue11 text-palette-white dark:text-palette-black'
              : 'border-palette-blue10 text-palette-blue11 dark:border-palette-blue9 dark:text-palette-blue9'
          )}>
          NEW
        </div>
      )}
      {info.isAlpha && (
        <div
          className={mergeClasses(
            BADGE_CLASS_NAME,
            isSelected
              ? 'border-palette-purple10 bg-palette-purple10 text-palette-white dark:text-palette-black'
              : 'border-[#8445bc] text-[#8445bc] dark:border-palette-purple9 dark:text-palette-purple10'
          )}>
          ALPHA
        </div>
      )}
      {info.isBeta && (
        <div
          className={mergeClasses(
            BADGE_CLASS_NAME,
            isSelected
              ? 'border-palette-purple10 bg-palette-purple10 text-palette-white dark:text-palette-black'
              : 'border-palette-purple10 text-palette-purple11 dark:border-palette-purple9 dark:text-palette-purple10'
          )}>
          BETA
        </div>
      )}
      {info.isPreview && (
        <div
          className={mergeClasses(
            BADGE_CLASS_NAME,
            isSelected
              ? 'border-palette-purple10 bg-palette-purple10 text-palette-white dark:text-palette-black'
              : 'border-palette-purple10 text-palette-purple11 dark:border-palette-purple9 dark:text-palette-purple10'
          )}>
          PREVIEW
        </div>
      )}
      {isExternal && (
        <ArrowUpRightIcon
          aria-hidden="true"
          className="ml-auto icon-sm shrink-0 text-icon-secondary"
        />
      )}
    </LinkBase>
  );
};
