import { mergeClasses } from '@expo/styleguide';
import ReactMarkdown from 'react-markdown';

import { InlineHelp } from '~/ui/components/InlineHelp';
import { BOLD } from '~/ui/components/Text';

import { CommentData } from './APIDataTypes';
import { getCommentContent, getTagData, mdComponents } from './APISectionUtils';
import { ELEMENT_SPACING } from './styles';

type Props = {
  comment?: CommentData;
  sticky?: boolean;
  className?: string;
};

export const APISectionDeprecationNote = ({ comment, className, sticky = false }: Props) => {
  const deprecation = getTagData('deprecated', comment);

  if (!deprecation) {
    return null;
  }

  const content = getCommentContent(deprecation.content);
  return (
    <div
      className={mergeClasses(
        `[table_&]: [table_&]:mt-0 ${ELEMENT_SPACING} [table_&]:last:mb-0`,
        sticky && '-mx-px -mt-px'
      )}>
      <InlineHelp
        size="sm"
        type="warning"
        key="deprecation-note"
        className={mergeClasses(
          'border-palette-yellow5',
          '[table_&]:last-of-type:mb-2.5',
          sticky && 'mb-0 rounded-t-lg rounded-b-none px-4 shadow-none max-md:px-4',
          className
        )}>
        {content.length > 0 ? (
          <ReactMarkdown components={mdComponents}>{`**Deprecated:** ${content}`}</ReactMarkdown>
        ) : (
          <BOLD>Deprecated</BOLD>
        )}
      </InlineHelp>
    </div>
  );
};
