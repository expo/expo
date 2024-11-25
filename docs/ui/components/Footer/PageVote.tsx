import { Button, mergeClasses } from '@expo/styleguide';
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
        'mb-4 flex min-h-[32px] items-center',
        userVoted ? 'content-start' : 'content-center',
        'max-md-gutters:mx-auto max-md-gutters:mb-8 max-md-gutters:justify-center'
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
            <Button
              theme="secondary"
              size="xs"
              aria-label="Vote down"
              className="mx-1 min-w-[40px] text-center"
              leftSlot={<ThumbsDownIcon className="icon-sm" />}
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
