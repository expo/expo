import { css } from '@emotion/react';
import { Button } from '@expo/styleguide';
import { spacing } from '@expo/styleguide-base';
import { ThumbsDownSolidIcon, ThumbsUpSolidIcon } from '@expo/styleguide-icons';
import { useState } from 'react';

import { CALLOUT } from '../Text';

import { reportPageVote } from '~/providers/Analytics';

export const PageVote = () => {
  const [userVoted, setUserVoted] = useState(false);
  return (
    <div css={wrapperStyle}>
      <CALLOUT theme="secondary" weight="medium">
        Was this doc helpful?
      </CALLOUT>
      {userVoted ? (
        <CALLOUT theme="secondary" css={ratedTextStyle}>
          Thank you for your vote! 💙
        </CALLOUT>
      ) : (
        <div css={voteButtonsWrapperStyle}>
          <Button
            theme="quaternary"
            size="xs"
            aria-label="Vote up"
            css={voteButtonStyle}
            leftSlot={<ThumbsUpSolidIcon className="icon-sm" />}
            onClick={() => {
              reportPageVote({ status: true });
              setUserVoted(true);
            }}
          />
          <Button
            theme="quaternary"
            size="xs"
            aria-label="Vote down"
            css={voteButtonStyle}
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

const wrapperStyle = css({
  minWidth: 200,
});

const voteButtonsWrapperStyle = css({
  display: 'flex',
  flexDirection: 'row',
});

const voteButtonStyle = css({
  margin: `${spacing[2.5]}px ${spacing[1]}px 0`,
  minWidth: 42,
  textAlign: 'center',
});

const ratedTextStyle = css({
  padding: `${spacing[3]}px 0`,
});
