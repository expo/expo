import { Button } from '@expo/styleguide';
import { ThumbsDownIcon, ThumbsUpIcon } from '@expo/styleguide-icons';
import { useState } from 'react';

import { CALLOUT } from '../Text';

import { reportPageVote } from '~/providers/Analytics';

export const PageVote = () => {
  const [userVoted, setUserVoted] = useState(false);
  return (
    <div>
      {userVoted ? (
        <CALLOUT theme="secondary" className="py-1">
          Thank you for your vote! 💙
        </CALLOUT>
      ) : (
        <div className="flex flex-row items-center gap-2 max-large:flex-col">
          <CALLOUT theme="secondary" weight="medium" className="px-2">
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
