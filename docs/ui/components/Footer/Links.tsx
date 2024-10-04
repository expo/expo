import { css } from '@emotion/react';
import { theme, typography } from '@expo/styleguide';
import { spacing } from '@expo/styleguide-base';
import { Edit05Icon, GithubIcon, MessageDotsSquareIcon } from '@expo/styleguide-icons';

import { A, LI } from '../Text';
import { githubUrl } from './utils';

export const IssuesLink = ({ title, repositoryUrl }: { title: string; repositoryUrl?: string }) => (
  <LI>
    <A
      css={linkStyle}
      openInNewTab
      href={
        repositoryUrl ? `${repositoryUrl}/issues` : `https://github.com/expo/expo/labels/${title}`
      }>
      <span className="flex items-center mr-2.5">
        <GithubIcon className="text-icon-secondary" />
      </span>
      View open bug reports for {title}
    </A>
  </LI>
);

export const ForumsLink = ({ isAPIPage, title }: { isAPIPage: boolean; title: string }) =>
  isAPIPage ? (
    <LI>
      <A css={linkStyle} openInNewTab href={`https://forums.expo.dev/tag/${title}`}>
        <span className="flex items-center mr-2.5">
          <MessageDotsSquareIcon className="text-icon-secondary" />
        </span>
        Ask a question on the forums about {title}
      </A>
    </LI>
  ) : (
    <LI>
      <A css={linkStyle} openInNewTab href="https://forums.expo.dev/">
        <span className="flex items-center mr-2.5">
          <MessageDotsSquareIcon className="text-icon-secondary" />
        </span>
        Ask a question on the forums
      </A>
    </LI>
  );

export const EditPageLink = ({ pathname }: { pathname: string }) => (
  <LI>
    <A css={linkStyle} openInNewTab href={githubUrl(pathname)}>
      <span className="flex items-center mr-2.5">
        <Edit05Icon className="text-icon-secondary" />
      </span>
      Edit this page
    </A>
  </LI>
);

const linkStyle = css({
  ...typography.fontSizes[14],
  textDecoration: 'none',
  color: theme.text.secondary,
  display: 'inline-flex',
  alignItems: 'center',
  marginBottom: spacing[1],

  ':visited': {
    color: theme.text.secondary,
  },
});
