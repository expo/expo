import { Button, mergeClasses } from '@expo/styleguide';
import { ThumbsDownIcon, ThumbsUpIcon } from '@expo/styleguide-icons';
import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';

import { FeedbackDialog } from './FeedbackDialog';

import { reportPageVote } from '~/providers/Analytics';
import { CALLOUT } from '~/ui/components/Text';

type Props = {
  pathname?: string;
};

export const PageVote = ({ pathname }: Props) => {
  const [open, setOpen] = useState(false);
  const [userVoted, setUserVoted] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <div
        className={mergeClasses(
          'mb-4 flex items-center min-h-[32px]',
          userVoted ? 'content-start' : 'content-center',
          'max-md-gutters:mb-8 max-md-gutters:mx-auto max-md-gutters:justify-center'
        )}>
        {userVoted ? (
          <CALLOUT theme="secondary">Thank you for your vote! 💙</CALLOUT>
        ) : (
          <div className="flex flex-row items-center gap-2 max-md-gutters:flex-col">
            <CALLOUT theme="secondary" weight="medium">
              Was this doc helpful?
            </CALLOUT>
            <div>
              <Button
                theme="secondary"
                size="xs"
                aria-label="Vote up"
                className="mx-1 min-w-[40px] text-center"
                leftSlot={<ThumbsUpIcon className="icon-sm" />}
                onClick={() => {
                  reportPageVote({ status: true });
                  setUserVoted(true);
                }}
              />
              <Dialog.Trigger asChild>
                <Button
                  theme="secondary"
                  size="xs"
                  aria-label="Vote down"
                  className="mx-1 min-w-[40px] text-center"
                  leftSlot={<ThumbsDownIcon className="icon-sm" />}
                  onClick={() => {
                    reportPageVote({ status: false });
                    setUserVoted(true);
                    setOpen(true);
                  }}
                />
              </Dialog.Trigger>
            </div>
          </div>
        )}
      </div>
      <FeedbackDialog pathname={pathname} />
    </Dialog.Root>
  );
};
