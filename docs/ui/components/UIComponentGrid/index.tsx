import { mergeClasses } from '@expo/styleguide';
import { AndroidIcon } from '@expo/styleguide-icons/custom/AndroidIcon';
import { AppleIcon } from '@expo/styleguide-icons/custom/AppleIcon';
import { ReactLogoIcon } from '@expo/styleguide-icons/custom/ReactLogoIcon';
import { ArrowRightIcon } from '@expo/styleguide-icons/outline/ArrowRightIcon';
import { useRouter } from 'next/compat/router';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { PlatformTabs } from '~/ui/components/PlatformTabs';
import {
  type Platform,
  PlatformTabsGroup,
  orderPlatforms,
  usePlatformSelection,
} from '~/ui/components/PlatformTabs/platform';
import { A, LABEL } from '~/ui/components/Text';

const THUMBNAIL_WIDTH = 918;
const THUMBNAIL_HEIGHT = 631;

const SURFACE = 'bg-[#f1f1f3] dark:bg-[#222]';

const PLACEHOLDER_ICON = {
  android: AndroidIcon,
  ios: AppleIcon,
  hook: ReactLogoIcon,
} as const;

type PlaceholderKind = keyof typeof PLACEHOLDER_ICON;

const SectionContext = createContext<string | null>(null);

/**
 * One grid is rendered by two pages at different depths (the section index and the Expo UI
 * overview), so a page-relative href would resolve differently on each. Links are built from
 * the grid's own section plus the version in the URL, which is correct from either page and
 * keeps the build-time `latest` copy pointing inside `latest`.
 */
function useComponentHref(slug: string) {
  const router = useRouter();
  const section = useContext(SectionContext);
  const path = (router?.asPath ?? '').split(/[#?]/)[0];
  const version = path.match(/^\/versions\/([^/]+)\//)?.[1];
  if (!section || !version) {
    return slug;
  }
  return `/versions/${version}/sdk/ui/${section}/${slug}/`;
}

type UIComponentGridProps = PropsWithChildren<{
  /** Section directory the cards belong to, for example `swift-ui`. */
  section: string;
  /** Show an Android/iOS switcher for cards that carry a thumbnail per platform. */
  platformTabs?: boolean;
  className?: string;
}>;

const HEADING_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);
const HEADING_ALIGN_MIN_WIDTH = 768;
const ESTIMATED_HEADING_OFFSET = 40;

/**
 * Sits on the line of the heading that precedes the grid, so the switcher reads as a control on
 * the section rather than on the first card. The offset is measured rather than hardcoded: the
 * same grid follows an `h2` on the section overview and an `h3` on the Expo UI overview, and each
 * heading changes height at two breakpoints. The switcher is lifted out of the flow so the grid
 * keeps the position it has on pages without one. Below `md` the heading can wrap into the
 * switcher, so it drops back into the flow on its own row.
 */
function GridPlatformTabs() {
  const available: Platform[] = ['android', 'ios'];
  const { active, select } = usePlatformSelection(available);
  const anchorRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState<number | null>(-ESTIMATED_HEADING_OFFSET);

  useEffect(() => {
    const tabs = tabsRef.current;
    const heading = anchorRef.current?.previousElementSibling;
    if (!tabs || !heading || !HEADING_TAGS.has(heading.tagName)) {
      return;
    }
    const measure = () => {
      if (window.innerWidth < HEADING_ALIGN_MIN_WIDTH) {
        setTop(null);
        return;
      }
      const gap = Number.parseFloat(getComputedStyle(heading).marginBottom) || 0;
      const headingCenter = gap + heading.getBoundingClientRect().height / 2;
      setTop(-(headingCenter + tabs.getBoundingClientRect().height / 2));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(heading);
    return () => {
      observer.disconnect();
    };
  }, []);

  const isAligned = top !== null;

  return (
    <div ref={anchorRef} className={isAligned ? 'relative h-0' : 'mb-3 flex justify-end'}>
      <div
        ref={tabsRef}
        className={isAligned ? 'absolute right-0' : undefined}
        style={isAligned ? { top } : undefined}>
        <PlatformTabs available={available} active={active} select={select} />
      </div>
    </div>
  );
}

export function UIComponentGrid({
  children,
  section,
  platformTabs = false,
  className,
}: UIComponentGridProps) {
  return (
    <SectionContext.Provider value={section}>
      <PlatformTabsGroup>
        {platformTabs && <GridPlatformTabs />}
        <div
          data-md="ui-component-grid"
          className={mergeClasses(
            'my-5 grid grid-cols-3 gap-4',
            'max-lg:grid-cols-2',
            'max-md:grid-cols-1',
            className
          )}>
          {children}
        </div>
      </PlatformTabsGroup>
    </SectionContext.Provider>
  );
}

type CardThumbnail = {
  src: string;
  darkSrc?: string;
};

type UIComponentCardProps = {
  title: string;
  /** Page slug within the grid's section, for example `alert`. */
  slug: string;
  description?: string;
  src?: string;
  darkSrc?: string;
  /** Universal components render on both platforms, so they ship a thumbnail for each. */
  android?: CardThumbnail;
  ios?: CardThumbnail;
  placeholder?: PlaceholderKind;
};

export function UIComponentCard({
  title,
  slug,
  description,
  src,
  darkSrc,
  android,
  ios,
  placeholder = 'android',
}: UIComponentCardProps) {
  const resolvedHref = useComponentHref(slug);
  const PlaceholderIcon = PLACEHOLDER_ICON[placeholder];
  const thumbnails = { ...(android && { android }), ...(ios && { ios }) };
  const available = orderPlatforms(thumbnails);
  const { active } = usePlatformSelection(available);
  const thumbnail = available.length > 0 ? thumbnails[active] : undefined;
  const lightSrc = thumbnail?.src ?? src;
  const nightSrc = thumbnail ? thumbnail.darkSrc : darkSrc;
  return (
    <A
      href={resolvedHref}
      data-md-description={description}
      className={mergeClasses(
        'group flex flex-col overflow-hidden rounded-lg border border-default bg-default shadow-xs transition',
        'hocus:shadow-sm'
      )}
      isStyled>
      <div
        className={mergeClasses('relative overflow-hidden', SURFACE)}
        style={{ aspectRatio: `${THUMBNAIL_WIDTH} / ${THUMBNAIL_HEIGHT}` }}>
        {lightSrc ? (
          <>
            <img
              src={lightSrc}
              alt=""
              width={THUMBNAIL_WIDTH}
              height={THUMBNAIL_HEIGHT}
              loading="lazy"
              decoding="async"
              className={mergeClasses(
                'size-full object-cover transition-transform group-hover:scale-105',
                nightSrc && 'dark:hidden'
              )}
            />
            {nightSrc && (
              <img
                src={nightSrc}
                alt=""
                width={THUMBNAIL_WIDTH}
                height={THUMBNAIL_HEIGHT}
                loading="lazy"
                decoding="async"
                className="hidden size-full object-cover transition-transform dark:block group-hover:scale-105"
              />
            )}
          </>
        ) : (
          <div className="flex size-full items-center justify-center [&_svg]:size-16">
            <PlaceholderIcon
              aria-hidden="true"
              className="text-icon-tertiary transition-transform group-hover:scale-105"
            />
          </div>
        )}
      </div>
      <LABEL className="flex items-center justify-between gap-3 border-t border-default p-4">
        {title}
        <ArrowRightIcon aria-hidden="true" className="shrink-0 text-icon-secondary" />
      </LABEL>
    </A>
  );
}
