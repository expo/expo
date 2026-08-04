import { mergeClasses } from '@expo/styleguide';
import { AndroidIcon } from '@expo/styleguide-icons/custom/AndroidIcon';
import { AppleIcon } from '@expo/styleguide-icons/custom/AppleIcon';
import { ReactLogoIcon } from '@expo/styleguide-icons/custom/ReactLogoIcon';
import { ArrowRightIcon } from '@expo/styleguide-icons/outline/ArrowRightIcon';
import { useRouter } from 'next/compat/router';
import type { PropsWithChildren } from 'react';

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

function useResolvedHref(href: string) {
  const router = useRouter();
  if (href.startsWith('/') || href.includes('://')) {
    return href;
  }
  const base = (router?.asPath ?? '').split(/[#?]/)[0].replace(/\/$/, '');
  return base ? `${base}/${href}` : href;
}

type UIComponentGridProps = PropsWithChildren<{
  className?: string;
}>;

export function UIComponentGrid({ children, className }: UIComponentGridProps) {
  return (
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
  );
}

type UIComponentCardProps = {
  title: string;
  href: string;
  description?: string;
  src?: string;
  darkSrc?: string;
  placeholder?: PlaceholderKind;
};

export function UIComponentCard({
  title,
  href,
  description,
  src,
  darkSrc,
  placeholder = 'android',
}: UIComponentCardProps) {
  const resolvedHref = useResolvedHref(href);
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
              className="size-full object-cover transition-transform dark:hidden group-hover:scale-105"
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
