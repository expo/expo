import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import { breakpoints, spacing } from '@expo/styleguide-base';
import { useRouter } from 'next/router';

import { ForumsLink, EditPageLink, IssuesLink } from './Links';

import { NewsletterSignUp } from '~/ui/components/Footer/NewsletterSignUp';
import { PageVote } from '~/ui/components/Footer/PageVote';
import { UL } from '~/ui/components/Text';

const NEWSLETTER_DISABLED = true as const;

type Props = {
  title: string;
  sourceCodeUrl?: string;
  packageName?: string;
};

export const Footer = ({ title, sourceCodeUrl, packageName }: Props) => {
  const { pathname } = useRouter();
  const isAPIPage = pathname.includes('/sdk/');
  const isExpoPackage = packageName && packageName.startsWith('expo-');

  return (
    <footer css={footerStyle}>
      <UL css={linksListStyle}>
        <ForumsLink isAPIPage={isAPIPage} title={title} />
        {isAPIPage && (
          <IssuesLink title={title} repositoryUrl={isExpoPackage ? undefined : sourceCodeUrl} />
        )}
        <EditPageLink pathname={pathname} />
      </UL>
      <PageVote />
      {!NEWSLETTER_DISABLED && <NewsletterSignUp />}
    </footer>
  );
};

const footerStyle = css({
  display: 'flex',
  flexDirection: 'row',
  borderTop: `1px solid ${theme.border.default}`,
  marginTop: spacing[10],
  paddingTop: spacing[10],

  [`@media screen and (max-width: ${(breakpoints.medium + breakpoints.large) / 2}px)`]: {
    flexDirection: 'column',
  },
});

const linksListStyle = css({
  flex: 1,
  marginTop: 0,
  marginLeft: 0,
  marginBottom: spacing[5],

  li: {
    listStyle: 'none',
  },
});
