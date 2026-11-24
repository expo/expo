import { LinkBase, mergeClasses } from '@expo/styleguide';
import { ArrowRightIcon } from '@expo/styleguide-icons/outline/ArrowRightIcon';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import { useRouter } from 'next/compat/router';
import type { AnchorHTMLAttributes, ComponentType, HTMLAttributes, ReactNode } from 'react';

import { DEMI, CALLOUT } from '~/ui/components/Text';

type BoxLinkProps = AnchorHTMLAttributes<HTMLLinkElement> & {
  title: string;
  description?: ReactNode;
  testID?: string;
  Icon?: ComponentType<HTMLAttributes<SVGSVGElement>>;
  imageUrl?: string;
  variant?: 'default' | 'row';
};

export function BoxLink({
  title,
  description,
  href,
  testID,
  Icon,
  imageUrl,
  variant,
}: BoxLinkProps) {
  const isExternal = Boolean(href?.startsWith('http'));
  const ArrowIcon = isExternal ? ArrowUpRightIcon : ArrowRightIcon;
  const router = useRouter();
  const isRow = (variant ?? getVariantForPath(router?.pathname)) === 'row';
  const leadingVisual = (
    <>
      {Icon && <Icon aria-hidden="true" className="icon-md shrink-0 text-icon-default" />}
      {imageUrl && <img className="size-5! shrink-0" src={imageUrl} alt="Icon" />}
    </>
  );
  return (
    <LinkBase
      href={href}
      // Used by scripts/generate-markdown-pages-utils.js to extract card link title/description
      data-md="card-link"
      className={mergeClasses(
        'flex rounded-lg outline-[0.5px] outline-(--expo-theme-border-default) outline-offset-[-0.5px] transition hocus:bg-subtle',
        isRow ? 'mb-2 flex-row items-center gap-6 px-6 py-4' : 'mb-5 flex-col gap-6 p-4'
      )}
      data-testid={testID}
      openInNewTab={isExternal}>
      {isRow ? (
        leadingVisual
      ) : (
        <div className="flex flex-row items-start">
          {leadingVisual}
          <ArrowUpRightIcon
            aria-hidden="true"
            className="ml-auto icon-md shrink-0 text-icon-default"
          />
        </div>
      )}
      <div className={mergeClasses('flex flex-col', isRow ? 'flex-1' : 'gap-1')}>
        <DEMI
          className={mergeClasses(
            isRow ? 'text-[16px]' : 'text-[14px]',
            'leading-[1.4] font-semibold text-default'
          )}>
          {title}
        </DEMI>
        {description && (
          <CALLOUT theme="secondary" className="leading-[1.4] font-medium tracking-normal">
            {description}
          </CALLOUT>
        )}
      </div>
      {isRow && <ArrowIcon aria-hidden="true" className="icon-sm shrink-0 text-icon-default" />}
    </LinkBase>
  );
}

function getVariantForPath(pathname?: string): NonNullable<BoxLinkProps['variant']> {
  const isIntroductoryPage =
    !!pathname &&
    (/^\/get-started(\/|$)/.test(pathname) ||
      /\/overview\/?$/.test(pathname) ||
      /^\/[^/]+\/?$/.test(pathname));
  return isIntroductoryPage ? 'default' : 'row';
}
