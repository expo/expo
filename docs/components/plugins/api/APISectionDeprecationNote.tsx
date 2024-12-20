import { mergeClasses } from '@expo/styleguide';
import ReactMarkdown from 'react-markdown';
import { InlineHelp } from 'ui/components/InlineHelp';

import { BOLD } from '~/ui/components/Text';

import { CommentData } from './APIDataTypes';
import { getCommentContent, getTagData, mdComponents } from './APISectionUtils';
import { ELEMENT_SPACING } from './styles';

type Props = {
  comment?: CommentData;
  sticky?: boolean;
};

export const APISectionDeprecationNote = ({ comment, sticky = false }: Props) => {
  const deprecation = getTagData('deprecated', comment);

  if (!deprecation) {
    return null;
  }

  const content = getCommentContent(deprecation.content);
  return (
    <div
      className={mergeClasses(
        `[table_&]:mt-0 [table_&]:${ELEMENT_SPACING} [table_&]:last:mb-0`,
        sticky && '-mx-px -mt-px'
      )}>
      <InlineHelp
        size="sm"
        type="warning"
        key="deprecation-note"
        className={mergeClasses(
          'border-palette-yellow5',
          '[table_&]:last-of-type:mb-2.5',
          sticky && 'mb-0 rounded-b-none rounded-t-lg px-4 shadow-none max-md-gutters:px-4'
        )}>
        {content.length ? (
          <ReactMarkdown components={mdComponents}>{`**Deprecated** ${content}`}</ReactMarkdown>
        ) : (
          <BOLD>Deprecated</BOLD>
        )}
      </InlineHelp>
    </div>
  );
};
