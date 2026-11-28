import { ButtonBase } from '@expo/styleguide';
import { CheckIcon } from '@expo/styleguide-icons/outline/CheckIcon';
import { XCloseIcon } from '@expo/styleguide-icons/outline/XCloseIcon';
import { useState } from 'react';
import { useIntl } from 'react-intl';

import { reportPageVote } from '~/providers/Analytics';
import { FOOTNOTE } from '~/ui/components/Text';

const voteButtonClassName =
  'flex items-center rounded-[24px] border-[0.5px] border-default p-[7.5px] text-icon-default hocus:bg-subtle';

export const PageVote = () => {
  const intl = useIntl();
  const [userVoted, setUserVoted] = useState(false);

  if (userVoted) {
    return (
      <FOOTNOTE theme="secondary" className="py-2">
        {intl.formatMessage({ id: 'footerThankYouForVote' })}
      </FOOTNOTE>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="py-2 eyebrow text-[#80838d] dark:text-tertiary">
        {intl.formatMessage({ id: 'footerWasHelpful' })}
      </p>
      <div className="flex items-center gap-1 rounded-[48px] py-1">
        <ButtonBase
          aria-label="Vote up"
          className={voteButtonClassName}
          onClick={() => {
            reportPageVote({ status: true });
            setUserVoted(true);
          }}>
          <CheckIcon aria-hidden="true" className="icon-xs" />
        </ButtonBase>
        <ButtonBase
          aria-label="Vote down"
          className={voteButtonClassName}
          onClick={() => {
            reportPageVote({ status: false });
            setUserVoted(true);
          }}>
          <XCloseIcon aria-hidden="true" className="icon-xs" />
        </ButtonBase>
      </div>
    </div>
  );
};
