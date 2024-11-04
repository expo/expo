import { ButtonBase, mergeClasses } from '@expo/styleguide';
import { ChevronDownIcon } from '@expo/styleguide-icons/outline/ChevronDownIcon';
import { useRouter } from 'next/compat/router';
import type { PropsWithChildren } from 'react';
import { useEffect, useRef, useState } from 'react';

import { CALLOUT } from '../Text';

import { stripVersionFromPath } from '~/common/utilities';
import { NavigationRoute } from '~/types/common';

if (typeof window !== 'undefined' && !window.hasOwnProperty('sidebarState')) {
  window.sidebarState = {};
}

type Props = PropsWithChildren<{
  info: NavigationRoute;
}>;

export function SidebarCollapsible({ info, children }: Props) {
  const router = useRouter();
  const ref = useRef<HTMLButtonElement>(null);

  const isChildRouteActive = () => {
    let result = false;

    const sections = info.children;

    const isSectionActive = (section: NavigationRoute) => {
      const linkUrl = stripVersionFromPath(section.as || section.href);
      const pathname = stripVersionFromPath(router?.pathname);
      const asPath = stripVersionFromPath(router?.asPath);

      if (linkUrl === pathname || linkUrl === asPath) {
        result = true;
      }
    };

    const posts: NavigationRoute[] =
      sections
        ?.map(section => (section.type === 'page' ? [section] : (section?.children ?? [])))
        .flat() ?? [];

    posts.forEach(isSectionActive);
    return result;
  };

  const hasCachedState =
    typeof window !== 'undefined' && window.sidebarState[info.name] !== undefined;

  const containsActiveChild = isChildRouteActive();
  const initState = hasCachedState
    ? window.sidebarState[info.name]
    : containsActiveChild || info.expanded;

  const [isOpen, setOpen] = useState(initState);

  useEffect(() => {
    if (containsActiveChild) {
      window.sidebarState[info.name] = true;
    }
  }, []);

  const toggleIsOpen = () => {
    setOpen(prevState => !prevState);
    window.sidebarState[info.name] = !isOpen;
  };

  const customDataAttributes = containsActiveChild && {
    'data-collapsible-active': true,
  };

  return (
    <>
      <ButtonBase
        ref={ref}
        className={mergeClasses(
          'flex items-center gap-2 relative select-none duration-150 px-3 py-1.5 w-full cursor-pointer rounded-md transition',
          'hocus:bg-element'
        )}
        aria-expanded={isOpen ? 'true' : 'false'}
        onClick={toggleIsOpen}
        {...customDataAttributes}>
        <div className="bg-default border border-default rounded-sm flex items-center justify-center shadow-xs size-4">
          <ChevronDownIcon
            className={mergeClasses(
              'icon-xs text-icon-secondary transition-transform duration-150',
              !isOpen && '-rotate-90 translate-x-[0.5px]'
            )}
          />
        </div>
        <CALLOUT crawlable={false}>{info.name}</CALLOUT>
      </ButtonBase>
      {isOpen && (
        <div aria-hidden={!isOpen ? 'true' : 'false'} className="pl-2.5">
          {children}
        </div>
      )}
    </>
  );
}
