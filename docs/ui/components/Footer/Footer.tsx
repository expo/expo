import { LinkBase, mergeClasses } from '@expo/styleguide';
import { ArrowLeftIcon } from '@expo/styleguide-icons/outline/ArrowLeftIcon';
import { ArrowRightIcon } from '@expo/styleguide-icons/outline/ArrowRightIcon';
import { useRouter } from 'next/compat/router';

import { ForumsLink, EditPageLink, IssuesLink, ShareFeedbackLink } from './Links';
import { NewsletterSignUp } from './NewsletterSignUp';
import { PageVote } from './PageVote';

import { NavigationRouteWithSection } from '~/types/common';
import { P, FOOTNOTE, UL, LI } from '~/ui/components/Text';

type Props = {
  title?: string;
  sourceCodeUrl?: string;
  packageName?: string;
  previousPage?: NavigationRouteWithSection;
  nextPage?: NavigationRouteWithSection;
  modificationDate?: string;
};

const isDev = process.env.NODE_ENV === 'development';

export const Footer = ({
  title,
  sourceCodeUrl,
  packageName,
  previousPage,
  nextPage,
  modificationDate,
}: Props) => {
  const router = useRouter();
  const isAPIPage = router?.pathname.includes('/sdk/') ?? false;
  const isTutorial = router?.pathname.includes('/tutorial/') ?? false;
  const isExpoPackage = packageName ? packageName.startsWith('expo-') : isAPIPage;

  const shouldShowModifiedDate = !isExpoPackage && !isTutorial;

  return (
    <footer className={mergeClasses('flex flex-col gap-10', title && 'pt-10', !title && 'pt-6')}>
      {title && (previousPage || nextPage) && (
        <div
          className={mergeClasses(
            'flex gap-4',
            'max-xl-gutters:flex-col-reverse',
            'max-lg-gutters:flex-row',
            'max-md-gutters:flex-col-reverse'
          )}>
          {previousPage ? (
            <LinkBase
              href={previousPage.href}
              className={mergeClasses(
                'flex border items-center gap-3 border-solid border-default rounded-md py-3 px-4 w-full transition',
                'hocus:shadow-xs hocus:bg-subtle'
              )}>
              <ArrowLeftIcon className="text-icon-secondary shrink-0" />
              <div>
                <FOOTNOTE theme="secondary">
                  Previous{previousPage.section ? ` (${previousPage.section})` : ''}
                </FOOTNOTE>
                <P weight="medium">{previousPage.sidebarTitle ?? previousPage.name}</P>
              </div>
            </LinkBase>
          ) : (
            <div className="w-full" />
          )}
          {nextPage ? (
            <LinkBase
              href={nextPage.href}
              className={mergeClasses(
                'flex border justify-between items-center gap-3 border-solid border-default rounded-md py-3 px-4 w-full transition',
                'hocus:shadow-xs hocus:bg-subtle'
              )}>
              <div>
                <FOOTNOTE theme="secondary">
                  Next{nextPage?.section ? ` (${nextPage.section})` : ''}
                </FOOTNOTE>
                <P weight="medium">{nextPage.sidebarTitle ?? nextPage.name}</P>
              </div>
              <ArrowRightIcon className="text-icon-secondary shrink-0" />
            </LinkBase>
          ) : (
            <div className="w-full" />
          )}
        </div>
      )}
      <div
        className={mergeClasses('flex flex-row gap-4 justify-between', 'max-md-gutters:flex-col')}>
        <div>
          <PageVote />
          <UL className="flex-1 !mt-0 !ml-0 !list-none">
            <ShareFeedbackLink pathname={router?.pathname} />
            {title && <ForumsLink isAPIPage={isAPIPage} title={title} />}
            {title && isAPIPage && (
              <IssuesLink title={title} repositoryUrl={isExpoPackage ? undefined : sourceCodeUrl} />
            )}
            {title && router?.pathname && <EditPageLink pathname={router.pathname} />}
            {!isDev && shouldShowModifiedDate && modificationDate && (
              <LI className="!text-quaternary !text-2xs !mt-4">
                Last updated on {modificationDate}
              </LI>
            )}
            {isDev && shouldShowModifiedDate && (
              <LI className="!text-quaternary !text-2xs !mt-4">
                Last updated data is not available in dev mode
              </LI>
            )}
          </UL>
        </div>
        <NewsletterSignUp />
      </div>
    </footer>
  );
};
