import { Button } from '@expo/styleguide';
import { ThumbsDownSolidIcon, ThumbsUpSolidIcon } from '@expo/styleguide-icons';
import { useState } from 'react';

import { CALLOUT } from '../Text';

import { reportPageVote } from '~/providers/Analytics';

export const PageVote = () => {
  const [userVoted, setUserVoted] = useState(false);
  return (
    <div className="min-w-[200px]">
      <CALLOUT theme="secondary" weight="medium">
        Was this doc helpful?
      </CALLOUT>
      {userVoted ? (
        <CALLOUT theme="secondary" className="py-3">
          Thank you for your vote! 💙
        </CALLOUT>
      ) : (
        <div className="flex flex-row">
          <Button
            theme="secondary"
            size="xs"
            aria-label="Vote up"
            className="mt-2.5 mx-1 min-w-[40px] text-center"
            leftSlot={<ThumbsUpSolidIcon className="icon-sm" />}
            onClick={() => {
              reportPageVote({ status: true });
              setUserVoted(true);
            }}
          />
          <Button
            theme="secondary"
            size="xs"
            aria-label="Vote down"
            className="mt-2.5 mx-1 min-w-[40px] text-center"
            leftSlot={<ThumbsDownSolidIcon className="icon-sm" />}
            onClick={() => {
              reportPageVote({ status: false });
              setUserVoted(true);
            }}
          />
        </div>
      )}
    </div>
  );
};
