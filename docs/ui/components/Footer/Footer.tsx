import { LinkBase, mergeClasses } from '@expo/styleguide';
import { ArrowLeftIcon, ArrowRightIcon } from '@expo/styleguide-icons';
import { useRouter } from 'next/compat/router';

import { ForumsLink, EditPageLink, IssuesLink, ShareFeedbackLink } from './Links';
import { NewsletterSignUp } from './NewsletterSignUp';
import { PageVote } from './PageVote';

import { NavigationRouteWithSection } from '~/types/common';
import { P, FOOTNOTE, UL } from '~/ui/components/Text';

type Props = {
  title?: string;
  sourceCodeUrl?: string;
  packageName?: string;
  previousPage?: NavigationRouteWithSection;
  nextPage?: NavigationRouteWithSection;
};

export const Footer = ({ title, sourceCodeUrl, packageName, previousPage, nextPage }: Props) => {
  const router = useRouter();
  const isAPIPage = router?.pathname.includes('/sdk/') ?? false;
  const isExpoPackage = packageName && packageName.startsWith('expo-');

  return (
    <footer
      className={mergeClasses(
        'flex flex-col gap-8',
        title && 'pt-10 mt-10 border-t border-default',
        !title && 'pt-2'
      )}>
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
        className={mergeClasses(
          'flex flex-row max-md-gutters:flex-col max-md-gutters:gap-4',
          title ? 'justify-between' : 'justify-center'
        )}>
        {title && (
          <div>
            <PageVote />
            <UL className="flex-1 !mt-0 !ml-0 !list-none">
              <ShareFeedbackLink pathname={router?.pathname} />
              <ForumsLink isAPIPage={isAPIPage} title={title} />
              {isAPIPage && (
                <IssuesLink
                  title={title}
                  repositoryUrl={isExpoPackage ? undefined : sourceCodeUrl}
                />
              )}
              {router?.pathname && <EditPageLink pathname={router.pathname} />}
            </UL>
          </div>
        )}
        <NewsletterSignUp />
      </div>
    </footer>
  );
};
