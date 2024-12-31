import { mergeClasses } from '@expo/styleguide';
import { CodeSquare01Icon } from '@expo/styleguide-icons/outline/CodeSquare01Icon';
import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkSupsub from 'remark-supersub';
import { InlineHelp } from 'ui/components/InlineHelp';

import { Tag } from '~/ui/components/Tag/Tag';
import { CALLOUT } from '~/ui/components/Text';

import { MDComponents } from '../types';
import { APIBoxSectionHeader } from './APIBoxSectionHeader';
import { CommentData } from '../APIDataTypes';
import {
  getAllTagData,
  getCommentContent,
  getTagData,
  mdComponents,
  parseCommentContent,
} from '../APISectionUtils';
import { ELEMENT_SPACING, STYLES_SECONDARY } from '../styles';
import { APISectionPlatformTags } from './APISectionPlatformTags';

type Props = {
  comment?: CommentData;
  components?: MDComponents;
  beforeContent?: ReactNode;
  afterContent?: ReactNode;
  includePlatforms?: boolean;
  includeSpacing?: boolean;
  inlineHeaders?: boolean;
  emptyCommentFallback?: string;
};

export const APICommentTextBlock = ({
  comment,
  beforeContent,
  afterContent,
  includePlatforms = true,
  includeSpacing = true,
  inlineHeaders = false,
  emptyCommentFallback,
}: Props) => {
  const content = comment?.summary ? getCommentContent(comment.summary) : undefined;

  if (emptyCommentFallback && !content?.length) {
    return <span className="text-quaternary">{emptyCommentFallback}</span>;
  }

  const paramTags = content ? getParamTags(content) : undefined;
  const parsedContent = (
    <ReactMarkdown components={mdComponents} remarkPlugins={[remarkGfm, remarkSupsub]}>
      {parseCommentContent(paramTags ? content?.replaceAll(PARAM_TAGS_REGEX, '') : content)}
    </ReactMarkdown>
  );

  const examples = getAllTagData('example', comment);
  const exampleContent = examples?.map((example, index) => {
    const exampleText = getCommentContent(example.content ?? example.name);
    const isMultiline = /[\n\r]/.test(exampleText);

    return (
      <div
        key={'example-' + index}
        className={mergeClasses(
          ELEMENT_SPACING,
          !isMultiline && 'flex items-center gap-1.5',
          'last:[&>*]:!mb-0'
        )}>
        {inlineHeaders ? (
          <CALLOUT
            className={mergeClasses(
              'my-1.5 flex flex-row items-center gap-1.5 font-medium text-tertiary',
              !isMultiline && 'my-0'
            )}>
            <CodeSquare01Icon className="icon-sm -mt-px text-icon-tertiary" />
            Example
          </CALLOUT>
        ) : (
          <APIBoxSectionHeader text="Example" className="-mx-4 mb-3 mt-1" Icon={CodeSquare01Icon} />
        )}
        <ReactMarkdown components={mdComponents} remarkPlugins={[remarkGfm, remarkSupsub]}>
          {exampleText}
        </ReactMarkdown>
      </div>
    );
  });

  const see = getTagData('see', comment);
  const seeContent = see && (
    <InlineHelp
      className={mergeClasses('shadow-none', `!${ELEMENT_SPACING}`)}
      size="sm"
      type="info-light">
      <ReactMarkdown components={mdComponents} remarkPlugins={[remarkGfm, remarkSupsub]}>
        {`**See:** ` + getCommentContent(see.content)}
      </ReactMarkdown>
    </InlineHelp>
  );

  const hasPlatforms = (getAllTagData('platform', comment)?.length || 0) > 0;

  return (
    <div className={mergeClasses(includeSpacing && 'px-4 [table_&]:!mb-0 [table_&]:px-0')}>
      {includePlatforms && hasPlatforms && (
        <APISectionPlatformTags
          comment={comment}
          prefix={emptyCommentFallback ? 'Only for:' : undefined}
        />
      )}
      {paramTags && (
        <>
          <span className={STYLES_SECONDARY}>Only for:&ensp;</span>
          {paramTags.map(tag => (
            <Tag key={tag} name={tag.split('-')[1]} />
          ))}
        </>
      )}
      {beforeContent}
      {parsedContent}
      {afterContent}
      {afterContent && !exampleContent && <br />}
      {seeContent}
      {exampleContent}
    </div>
  );
};

const PARAM_TAGS_REGEX = /@tag-\S*/g;

function getParamTags(shortText?: string) {
  if (!shortText?.includes('@tag-')) {
    return undefined;
  }
  return Array.from(shortText.matchAll(PARAM_TAGS_REGEX), match => match[0]);
}
