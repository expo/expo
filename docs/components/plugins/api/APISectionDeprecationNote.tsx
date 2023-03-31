import { css } from '@emotion/react';
import { spacing } from '@expo/styleguide-base';
import ReactMarkdown from 'react-markdown';

import { CommentData } from '~/components/plugins/api/APIDataTypes';
import {
  getCommentContent,
  getTagData,
  mdComponents,
} from '~/components/plugins/api/APISectionUtils';
import { Callout } from '~/ui/components/Callout';
import { BOLD } from '~/ui/components/Text';

type Props = {
  comment?: CommentData;
};

export const APISectionDeprecationNote = ({ comment }: Props) => {
  const deprecation = getTagData('deprecated', comment);

  if (!deprecation) {
    return null;
  }

  const content = getCommentContent(deprecation.content);
  return (
    <div css={deprecationNoticeStyle}>
      <Callout type="warning" key="deprecation-note">
        {content.length ? (
          <ReactMarkdown components={mdComponents}>{`**Deprecated.** ${content}`}</ReactMarkdown>
        ) : (
          <BOLD>Deprecated</BOLD>
        )}
      </Callout>
    </div>
  );
};

const deprecationNoticeStyle = css({
  'table &': {
    marginTop: 0,
    marginBottom: spacing[3],
  },
});
