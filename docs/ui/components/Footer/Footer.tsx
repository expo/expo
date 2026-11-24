import { LinkBase, mergeClasses } from '@expo/styleguide';
import { PrivacyChoicesButton } from '@expo/styleguide-cookie-consent';
import { ChevronLeftIcon } from '@expo/styleguide-icons/outline/ChevronLeftIcon';
import { ChevronRightIcon } from '@expo/styleguide-icons/outline/ChevronRightIcon';
import { useRouter } from 'next/compat/router';
import { useIntl } from 'react-intl';

import { NavigationRouteWithSection } from '~/types/common';
import { ThemeSelector } from '~/ui/components/Header/ThemeSelector';

import { BlogAndChangelogLink, NewsletterLink, ShareFeedbackLink } from './Links';
import { SystemStatus } from './SystemStatus';

type Props = {
  title?: string;
  packageName?: string;
  previousPage?: NavigationRouteWithSection;
  nextPage?: NavigationRouteWithSection;
  modificationDate?: string;
};

const isDev = process.env.NODE_ENV === 'development';

const PAGE_CARD_CLASSES = mergeClasses(
  'flex flex-1 items-center gap-4 rounded-lg border-0.5 border-default p-[23.5px] transition',
  'hocus:bg-subtle'
);
const PAGE_TITLE_CLASSES = 'text-sm leading-[1.4] font-medium text-default';
const PAGE_ICON_CLASSES = 'icon-sm shrink-0 text-[#80838d] dark:text-icon-default';
const BOTTOM_TEXT_CLASSES = 'text-xs leading-[1.6] font-medium';

export const Footer = ({ title, packageName, previousPage, nextPage, modificationDate }: Props) => {
  const router = useRouter();
  const intl = useIntl();
  const isAPIPage = router?.pathname.includes('/sdk/') ?? false;
  const isTutorial = router?.pathname.includes('/tutorial/') ?? false;
  const isExpoPackage = packageName ? packageName.startsWith('expo-') : isAPIPage;
  const shouldShowModifiedDate = !isExpoPackage && !isTutorial && title;

  return (
    <footer
      className={mergeClasses(
        'mx-auto flex w-full flex-col gap-8 pb-8',
        router?.pathname === '/' ? 'max-w-240' : 'max-w-168 pt-16',
        'max-lg:px-4'
      )}>
      {title && (previousPage || nextPage) && (
        <div className="flex gap-4 max-md:flex-col" data-nosnippet>
          {previousPage ? (
            <LinkBase href={previousPage.href} className={PAGE_CARD_CLASSES}>
              <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
                <span className="flex items-center gap-1">
                  <ChevronLeftIcon aria-hidden="true" className={PAGE_ICON_CLASSES} />
                  <span className="eyebrow text-[#80838d] dark:text-tertiary">
                    {intl.formatMessage({ id: 'footerPrevious' })}
                    {previousPage.section ? ` (${previousPage.section})` : ''}
                  </span>
                </span>
                <span className={PAGE_TITLE_CLASSES}>
                  {previousPage.sidebarTitle ?? previousPage.name}
                </span>
              </div>
            </LinkBase>
          ) : (
            <div className="flex-1 max-md:hidden" />
          )}
          {nextPage ? (
            <LinkBase
              href={nextPage.href}
              className={mergeClasses(PAGE_CARD_CLASSES, 'justify-end')}>
              <div className="flex min-w-0 flex-col items-end gap-1 text-right">
                <span className="flex items-center gap-1">
                  <span className="eyebrow text-[#80838d] dark:text-tertiary">
                    {intl.formatMessage({ id: 'footerNext' })}
                    {nextPage.section ? ` (${nextPage.section})` : ''}
                  </span>
                  <ChevronRightIcon aria-hidden="true" className={PAGE_ICON_CLASSES} />
                </span>
                <span className={PAGE_TITLE_CLASSES}>{nextPage.sidebarTitle ?? nextPage.name}</span>
              </div>
            </LinkBase>
          ) : (
            <div className="flex-1 max-md:hidden" />
          )}
        </div>
      )}
      <div className="flex flex-col items-start gap-2">
        <ShareFeedbackLink pathname={router?.pathname} />
        <BlogAndChangelogLink />
        <NewsletterLink />
        {!isDev && shouldShowModifiedDate && modificationDate && (
          <p className={mergeClasses(BOTTOM_TEXT_CLASSES, 'text-tertiary')}>
            Last updated on <time dateTime={modificationDate}>{modificationDate}</time>
          </p>
        )}
        {isDev && shouldShowModifiedDate && (
          <p className={mergeClasses(BOTTOM_TEXT_CLASSES, 'text-tertiary')}>
            Last updated data is not available in dev mode
          </p>
        )}
      </div>
      <div
        className={mergeClasses(
          'flex items-center justify-between gap-4 border-t-0.5 border-default pt-[23.5px]',
          'max-md:flex-col max-md:items-start'
        )}>
        <div className="flex flex-wrap items-center gap-4">
          <p
            className={mergeClasses(BOTTOM_TEXT_CLASSES, 'text-secondary')}
            suppressHydrationWarning>
            ©{new Date().getFullYear()} Expo
          </p>
          <SystemStatus />
          <div
            className={mergeClasses(
              '*:gap-2 *:text-xs *:leading-[1.6] *:font-medium',
              '[&_span]:font-medium [&_svg]:h-4.25'
            )}>
            <PrivacyChoicesButton fallbackHref="https://expo.dev/privacy/cookies" />
          </div>
        </div>
        <ThemeSelector ariaLabel="Theme selector (footer)" />
      </div>
    </footer>
  );
};
