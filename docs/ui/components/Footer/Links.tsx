import { mergeClasses } from '@expo/styleguide';
import { File04Icon } from '@expo/styleguide-icons/outline/File04Icon';
import { Mail01Icon } from '@expo/styleguide-icons/outline/Mail01Icon';
import { MessageCircle02Icon } from '@expo/styleguide-icons/outline/MessageCircle02Icon';
import * as Dialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { A } from '../Text';
import { FeedbackDialog } from './FeedbackDialog';

export const FOOTER_ROW_CLASSES =
  'flex items-center gap-1 text-sm leading-[1.4] font-medium text-secondary';
export const FOOTER_ICON_CLASSES = 'icon-sm shrink-0 text-icon-default';
const LINK_ROW_CLASSES = mergeClasses(
  FOOTER_ROW_CLASSES,
  'transition-colors focus-visible:outline-offset-4 hocus:text-default'
);
const INLINE_LINK_CLASSES = 'text-default focus-visible:outline-offset-4';

export const BlogAndChangelogLink = () => (
  <p className={FOOTER_ROW_CLASSES}>
    <File04Icon aria-hidden="true" className={FOOTER_ICON_CLASSES} />
    <span>
      Read{' '}
      <A isStyled href="https://expo.dev/blog" className={INLINE_LINK_CLASSES}>
        blog
      </A>{' '}
      and{' '}
      <A isStyled href="https://expo.dev/changelog" className={INLINE_LINK_CLASSES}>
        changelog
      </A>
    </span>
  </p>
);

export const NewsletterLink = () => (
  <p className={FOOTER_ROW_CLASSES}>
    <Mail01Icon aria-hidden="true" className={FOOTER_ICON_CLASSES} />
    <span>
      <FormattedMessage
        id="footerNewsletterSignUp"
        values={{
          newsletterLink: (chunks: ReactNode) => (
            <A
              isStyled
              openInNewTab
              href="https://expo.dev/mailing-list/signup"
              className={INLINE_LINK_CLASSES}>
              {chunks}
            </A>
          ),
        }}
      />
    </span>
  </p>
);

export const ShareFeedbackLink = ({ pathname }: { pathname?: string }) => {
  const intl = useIntl();
  return (
    <Dialog.Root>
      <Dialog.Trigger className={mergeClasses(LINK_ROW_CLASSES, 'cursor-pointer')}>
        <MessageCircle02Icon aria-hidden="true" className={FOOTER_ICON_CLASSES} />
        {intl.formatMessage({ id: 'footerShareFeedback' })}
      </Dialog.Trigger>
      <FeedbackDialog pathname={pathname} />
    </Dialog.Root>
  );
};
