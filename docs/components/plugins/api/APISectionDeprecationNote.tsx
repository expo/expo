import { css } from '@emotion/react';
import { theme, spacing } from '@expo/styleguide';
import React from 'react';
import ReactMarkdown from 'react-markdown';

import { B } from '~/components/base/paragraph';
import { CommentData } from '~/components/plugins/api/APIDataTypes';
import { getTagData, mdInlineComponents } from '~/components/plugins/api/APISectionUtils';
import { Callout } from '~/ui/components/Callout';

type Props = {
  comment?: CommentData;
};

export const APISectionDeprecationNote = ({ comment }: Props) => {
  const deprecation = getTagData('deprecated', comment);
  return deprecation ? (
    <div css={deprecationNoticeStyle}>
      <Callout type="warning" key="deprecation-note">
        {deprecation.text.trim().length ? (
          <ReactMarkdown
            components={mdInlineComponents}>{`**Deprecated.** ${deprecation.text}`}</ReactMarkdown>
        ) : (
          <B>Deprecated</B>
        )}
      </Callout>
    </div>
  ) : null;
};

const deprecationNoticeStyle = css({
  'table &': {
    marginTop: 0,
    marginBottom: spacing[3],

    span: {
      fontSize: '90%',
    },
  },
});
