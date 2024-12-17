import { mergeClasses } from '@expo/styleguide';
import { CodeSquare01Icon } from '@expo/styleguide-icons/outline/CodeSquare01Icon';
import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkSupsub from 'remark-supersub';

import { Callout } from '~/ui/components/Callout';
import { Tag } from '~/ui/components/Tag/Tag';
import { DEMI } from '~/ui/components/Text';

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
  inlineHeaders?: boolean;
  emptyCommentFallback?: string;
};

export const APICommentTextBlock = ({
  comment,
  beforeContent,
  afterContent,
  includePlatforms = true,
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
  const exampleText = examples?.map((example, index) => (
    <div key={'example-' + index} className={mergeClasses(ELEMENT_SPACING, 'last:[&>*]:mb-0')}>
      {inlineHeaders ? (
        <DEMI className="mb-1.5 flex flex-row items-center gap-1.5 text-secondary">
          <CodeSquare01Icon className="icon-sm" />
          Example
        </DEMI>
      ) : (
        <APIBoxSectionHeader text="Example" className="!mt-1" Icon={CodeSquare01Icon} />
      )}
      <ReactMarkdown components={mdComponents} remarkPlugins={[remarkGfm, remarkSupsub]}>
        {getCommentContent(example.content ?? example.name)}
      </ReactMarkdown>
    </div>
  ));

  const see = getTagData('see', comment);
  const seeText = see && (
    <Callout className={`!${ELEMENT_SPACING}`}>
      <ReactMarkdown components={mdComponents} remarkPlugins={[remarkGfm, remarkSupsub]}>
        {`**See:** ` + getCommentContent(see.content)}
      </ReactMarkdown>
    </Callout>
  );

  const hasPlatforms = (getAllTagData('platform', comment)?.length || 0) > 0;

  return (
    <>
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
      {afterContent && !exampleText && <br />}
      {seeText}
      {exampleText}
    </>
  );
};

const PARAM_TAGS_REGEX = /@tag-\S*/g;

function getParamTags(shortText?: string) {
  if (!shortText?.includes('@tag-')) {
    return undefined;
  }
  return Array.from(shortText.matchAll(PARAM_TAGS_REGEX), match => match[0]);
}
