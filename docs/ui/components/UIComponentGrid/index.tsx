import { mergeClasses } from '@expo/styleguide';
import { AndroidIcon } from '@expo/styleguide-icons/custom/AndroidIcon';
import { AppleIcon } from '@expo/styleguide-icons/custom/AppleIcon';
import { ReactLogoIcon } from '@expo/styleguide-icons/custom/ReactLogoIcon';
import { ArrowRightIcon } from '@expo/styleguide-icons/outline/ArrowRightIcon';
import { useRouter } from 'next/compat/router';
import { createContext, useContext, type PropsWithChildren } from 'react';

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
  className?: string;
}>;

export function UIComponentGrid({ children, section, className }: UIComponentGridProps) {
  return (
    <SectionContext.Provider value={section}>
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
    </SectionContext.Provider>
  );
}

type UIComponentCardProps = {
  title: string;
  /** Page slug within the grid's section, for example `alert`. */
  slug: string;
  description?: string;
  src?: string;
  darkSrc?: string;
  placeholder?: PlaceholderKind;
};

export function UIComponentCard({
  title,
  slug,
  description,
  src,
  darkSrc,
  placeholder = 'android',
}: UIComponentCardProps) {
  const resolvedHref = useComponentHref(slug);
  const PlaceholderIcon = PLACEHOLDER_ICON[placeholder];
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
        {src ? (
          <>
            <img
              src={src}
              alt=""
              width={THUMBNAIL_WIDTH}
              height={THUMBNAIL_HEIGHT}
              loading="lazy"
              decoding="async"
              className={mergeClasses(
                'size-full object-cover transition-transform group-hover:scale-105',
                darkSrc && 'dark:hidden'
              )}
            />
            {darkSrc && (
              <img
                src={darkSrc}
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
