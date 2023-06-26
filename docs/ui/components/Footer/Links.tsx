import { Edit05Icon, GithubIcon, MessageDotsSquareIcon } from '@expo/styleguide-icons';

import { A, CALLOUT, LI } from '../Text';
import { githubUrl } from './utils';

const LINK_CLASSES = 'inline-flex items-center mb-1 focus-visible:outline-offset-4';
const ICON_CLASSES = 'flex items-center mr-2.5 text-icon-secondary';

export const IssuesLink = ({ title, repositoryUrl }: { title: string; repositoryUrl?: string }) => (
  <LI>
    <A
      isStyled
      openInNewTab
      href={
        repositoryUrl ? `${repositoryUrl}/issues` : `https://github.com/expo/expo/labels/${title}`
      }
      className={LINK_CLASSES}>
      <GithubIcon className={ICON_CLASSES} />
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
        className={LINK_CLASSES}>
        <MessageDotsSquareIcon className={ICON_CLASSES} />
        <CALLOUT theme="secondary">Ask a question on the forums about {title}</CALLOUT>
      </A>
    </LI>
  ) : (
    <LI>
      <A isStyled openInNewTab href="https://forums.expo.dev/" className={LINK_CLASSES}>
        <MessageDotsSquareIcon className={ICON_CLASSES} />
        <CALLOUT theme="secondary">Ask a question on the forums</CALLOUT>
      </A>
    </LI>
  );

export const EditPageLink = ({ pathname }: { pathname: string }) => (
  <LI>
    <A isStyled openInNewTab href={githubUrl(pathname)} className={LINK_CLASSES}>
      <Edit05Icon className={ICON_CLASSES} />
      <CALLOUT theme="secondary">Edit this page</CALLOUT>
    </A>
  </LI>
);
