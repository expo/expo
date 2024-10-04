import {
  DiscordIcon,
  Edit05Icon,
  GithubIcon,
  MessageTextSquare02Icon,
} from '@expo/styleguide-icons';
import * as Dialog from '@radix-ui/react-dialog';

import { FeedbackDialog } from './FeedbackDialog';
import { githubUrl } from './utils';
import { A, CALLOUT, LI } from '../Text';

const LINK_CLASSES = 'inline-flex items-center mb-1 focus-visible:outline-offset-4';
const ICON_CLASSES = 'flex items-center mr-2.5 text-icon-secondary shrink-0';

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
      <A isStyled openInNewTab href="https://chat.expo.dev/" className={LINK_CLASSES}>
        <DiscordIcon className={ICON_CLASSES} />
        <CALLOUT theme="secondary">Ask a question on the forums about {title}</CALLOUT>
      </A>
    </LI>
  ) : (
    <LI>
      <A
        isStyled
        openInNewTab
        href="https://chat.expo.dev/"
        className={LINK_CLASSES}
        shouldLeakReferrer>
        <DiscordIcon className={ICON_CLASSES} />
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

export const ShareFeedbackLink = ({ pathname }: { pathname?: string }) => {
  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <LI>
          <A isStyled className={LINK_CLASSES}>
            <MessageTextSquare02Icon className={ICON_CLASSES} />
            <CALLOUT theme="secondary">Share your feedback</CALLOUT>
          </A>
        </LI>
      </Dialog.Trigger>
      <FeedbackDialog pathname={pathname} />
    </Dialog.Root>
  );
};
