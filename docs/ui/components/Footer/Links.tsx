import { Edit05Icon, GithubIcon, MessageDotsSquareIcon } from '@expo/styleguide-icons';

import { A, CALLOUT, LI } from '../Text';
import { githubUrl } from './utils';

export const IssuesLink = ({ title, repositoryUrl }: { title: string; repositoryUrl?: string }) => (
  <LI>
    <A
      isStyled
      openInNewTab
      href={
        repositoryUrl ? `${repositoryUrl}/issues` : `https://github.com/expo/expo/labels/${title}`
      }
      className="inline-flex items-center mb-1">
      <GithubIcon className="flex items-center mr-2.5 text-icon-secondary" />
      <CALLOUT theme="secondary">View open bug reports for {title}</CALLOUT>
    </A>
  </LI>
);

export const ForumsLink = ({ isAPIPage, title }: { isAPIPage: boolean; title: string }) =>
  isAPIPage ? (
    <LI>
      <A
        isStyled
        openInNewTab
        href={`https://forums.expo.dev/tag/${title}`}
        className="inline-flex items-center mb-1">
        <MessageDotsSquareIcon className="flex items-center mr-2.5 text-icon-secondary" />
        <CALLOUT theme="secondary">Ask a question on the forums about {title}</CALLOUT>
      </A>
    </LI>
  ) : (
    <LI>
      <A
        isStyled
        openInNewTab
        href="https://forums.expo.dev/"
        className="inline-flex items-center mb-1">
        <MessageDotsSquareIcon className="flex items-center mr-2.5 text-icon-secondary" />
        <CALLOUT theme="secondary">Ask a question on the forums</CALLOUT>
      </A>
    </LI>
  );

export const EditPageLink = ({ pathname }: { pathname: string }) => (
  <LI>
    <A isStyled openInNewTab href={githubUrl(pathname)} className="inline-flex items-center mb-1">
      <Edit05Icon className="flex items-center mr-2.5 text-icon-secondary" />
      <CALLOUT theme="secondary">Edit this page</CALLOUT>
    </A>
  </LI>
);
