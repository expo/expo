import { css } from '@emotion/react';
import { breakpoints, spacing, theme } from '@expo/styleguide';
import { useRouter } from 'next/router';

import { ForumsLink, GitHubLink, IssuesLink, SourceCodeLink } from './Links';

import { NewsletterSignUp } from '~/ui/components/Footer/NewsletterSignUp';
import { PageVote } from '~/ui/components/Footer/PageVote';
import { UL } from '~/ui/components/Text';

const NEWSLETTER_DISABLED = true as const;

type Props = {
  title: string;
  sourceCodeUrl?: string;
};

export const Footer = ({ title, sourceCodeUrl }: Props) => {
  const router = useRouter();

  const isAPIPage = router.asPath.includes('/sdk/');

  return (
    <footer css={footerStyle}>
      <UL css={linksListStyle}>
        <ForumsLink isAPIPage={isAPIPage} title={title} />
        {isAPIPage && <IssuesLink title={title} />}
        {isAPIPage && sourceCodeUrl && (
          <SourceCodeLink title={title} sourceCodeUrl={sourceCodeUrl} />
        )}
        {router && <GitHubLink pathname={router.pathname} />}
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
  listStyle: 'none',
  marginLeft: 0,
  marginBottom: spacing[5],
});
