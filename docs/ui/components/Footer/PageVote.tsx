import { Button, mergeClasses } from '@expo/styleguide';
import { ThumbsDownDuotoneIcon } from '@expo/styleguide-icons/duotone/ThumbsDownDuotoneIcon';
import { ThumbsUpDuotoneIcon } from '@expo/styleguide-icons/duotone/ThumbsUpDuotoneIcon';
import { ThumbsDownIcon } from '@expo/styleguide-icons/outline/ThumbsDownIcon';
import { ThumbsUpIcon } from '@expo/styleguide-icons/outline/ThumbsUpIcon';
import { useState } from 'react';

import { reportPageVote } from '~/providers/Analytics';
import { CALLOUT } from '~/ui/components/Text';

export const PageVote = () => {
  const [userVoted, setUserVoted] = useState(false);

  return (
    <div
      className={mergeClasses(
        'mb-4 flex min-h-8 items-center',
        userVoted ? 'content-start' : 'content-center',
        'max-md:mx-auto max-md:mb-8 max-md:justify-center'
      )}>
      {userVoted ? (
        <CALLOUT theme="secondary">Thank you for your vote! 💙</CALLOUT>
      ) : (
        <div className="flex flex-row items-center gap-2 max-md:flex-col">
          <CALLOUT theme="secondary" weight="medium">
            Was this doc helpful?
          </CALLOUT>
          <div>
            <Button
              theme="secondary"
              size="xs"
              aria-label="Vote up"
              className="group mx-1 min-w-10 text-center"
              leftSlot={
                <>
                  <ThumbsUpIcon className="icon-sm group-hover:hidden group-focus-visible:hidden" />
                  <ThumbsUpDuotoneIcon className="hidden icon-sm text-icon-success group-hover:flex group-focus-visible:flex" />
                </>
              }
              onClick={() => {
                reportPageVote({ status: true });
                setUserVoted(true);
              }}
            />
            <Button
              theme="secondary"
              size="xs"
              aria-label="Vote down"
              className="group mx-1 min-w-10 text-center"
              leftSlot={
                <>
                  <ThumbsDownIcon className="icon-sm group-hover:hidden group-focus-visible:hidden" />
                  <ThumbsDownDuotoneIcon className="hidden icon-sm text-icon-danger group-hover:flex group-focus-visible:flex" />
                </>
              }
              onClick={() => {
                reportPageVote({ status: false });
                setUserVoted(true);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
