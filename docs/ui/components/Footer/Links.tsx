import { css } from '@emotion/react';
import {
  EditIcon,
  GithubIcon,
  iconSize,
  MessageIcon,
  spacing,
  theme,
  typography,
} from '@expo/styleguide';

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
      <span css={iconStyle}>
        <GithubIcon size={iconSize.sm} />
      </span>
      View open bug reports for {title}
    </A>
  </LI>
);

export const ForumsLink = ({ isAPIPage, title }: { isAPIPage: boolean; title: string }) =>
  isAPIPage ? (
    <LI>
      <A css={linkStyle} openInNewTab href={`https://forums.expo.dev/tag/${title}`}>
        <span css={iconStyle}>
          <MessageIcon size={iconSize.sm} />
        </span>
        Ask a question on the forums about {title}
      </A>
    </LI>
  ) : (
    <LI>
      <A css={linkStyle} openInNewTab href="https://forums.expo.dev/">
        <span css={iconStyle}>
          <MessageIcon size={iconSize.sm} />
        </span>
        Ask a question on the forums
      </A>
    </LI>
  );

export const EditPageLink = ({ pathname }: { pathname: string }) => (
  <LI>
    <A css={linkStyle} openInNewTab href={githubUrl(pathname)}>
      <span css={iconStyle}>
        <EditIcon size={iconSize.sm} />
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

const iconStyle = css({
  display: 'flex',
  alignItems: 'center',
  marginRight: spacing[2.5],
});
