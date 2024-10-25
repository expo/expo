import { mergeClasses } from '@expo/styleguide';
import ReactMarkdown from 'react-markdown';

import { formatSchema } from './helpers';
import { FormattedProperty, Property } from './types';

import { HeadingType } from '~/common/headingManager';
import { CodeBlock } from '~/components/base/code';
import { APIBox } from '~/components/plugins/APIBox';
import { mdComponents } from '~/components/plugins/api/APISectionUtils';
import { Collapsible } from '~/ui/components/Collapsible';
import { P, CALLOUT, CODE, createPermalinkedComponent } from '~/ui/components/Text';

export type AppConfigSchemaProps = {
  schema: Record<string, Property>;
};

export default function AppConfigSchemaTable({ schema }: AppConfigSchemaProps) {
  const formattedSchema = formatSchema(Object.entries(schema));

  return (
    <div>
      {formattedSchema.map((formattedProperty, index) => (
        <AppConfigProperty
          {...formattedProperty}
          key={`${formattedProperty.name}-${index}`}
          nestingLevel={0}
        />
      ))}
    </div>
  );
}

type PropertyNameProps = { name: string; nestingLevel: number };

const Anchor = createPermalinkedComponent(P, {
  baseNestingLevel: 3,
  sidebarType: HeadingType.InlineCode,
});

function PropertyName({ name, nestingLevel }: PropertyNameProps) {
  return (
    <Anchor level={nestingLevel} data-testid={name} data-heading="true">
      <CODE className="!px-1.5 !text-sm">{name}</CODE>
    </Anchor>
  );
}

function AppConfigProperty({
  name,
  description,
  example,
  expoKit,
  bareWorkflow,
  type,
  nestingLevel,
  subproperties,
  parent,
}: FormattedProperty & { nestingLevel: number }) {
  return (
    <APIBox
      className={mergeClasses(
        '!mb-0 !rounded-none !border-b-0 !shadow-none',
        '[&]:first-of-type:!rounded-t-md',
        '[&]:last-of-type:!rounded-b-md [&]:last-of-type:!border-b [&]:last-of-type:!border-default'
      )}>
      <PropertyName name={name} nestingLevel={nestingLevel} />
      <CALLOUT theme="secondary" data-text="true" className="my-3">
        {Array.isArray(type) ? (
          <span className="grid grid-cols-1 gap-2 mb-2">
            One of types:{' '}
            {type.map((oneOfType, index) => (
              <CodeBlock className="!text-secondary !text-balance" inline key={`${name}-${index}`}>
                {oneOfType}
              </CodeBlock>
            ))}
          </span>
        ) : (
          <>
            Type: <CODE>{type ?? 'undefined'}</CODE>
          </>
        )}
        {nestingLevel > 0 && (
          <>
            &emsp;&bull;&emsp;Path:{' '}
            <code className="text-secondary px-1 break-words">
              {parent}.{name}
            </code>
          </>
        )}
      </CALLOUT>
      <ReactMarkdown components={mdComponents}>{description}</ReactMarkdown>
      {expoKit && (
        <Collapsible summary="ExpoKit">
          <ReactMarkdown components={mdComponents}>{expoKit}</ReactMarkdown>
        </Collapsible>
      )}
      {bareWorkflow && (
        <Collapsible summary="Bare Workflow">
          <ReactMarkdown components={mdComponents}>{bareWorkflow}</ReactMarkdown>
        </Collapsible>
      )}
      {example && (
        <span className="grid grid-cols-1 gap-2 mb-6">
          <CALLOUT theme="secondary" className="font-bold">
            Example
          </CALLOUT>
          <CodeBlock inline>{JSON.stringify(example, null, 2)}</CodeBlock>
        </span>
      )}
      {subproperties.length > 0 &&
        subproperties.map((formattedProperty, index) => (
          <AppConfigProperty
            {...formattedProperty}
            key={`${name}-${index}`}
            nestingLevel={nestingLevel + 1}
          />
        ))}
    </APIBox>
  );
}
