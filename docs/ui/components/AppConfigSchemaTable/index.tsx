import { mergeClasses } from '@expo/styleguide';
import ReactMarkdown from 'react-markdown';

import { HeadingType } from '~/common/headingManager';
import { CodeBlock } from '~/components/base/code';
import { APIBox } from '~/components/plugins/APIBox';
import { mdComponents } from '~/components/plugins/api/APISectionUtils';
import { Collapsible } from '~/ui/components/Collapsible';
import {
  CALLOUT,
  CODE,
  createPermalinkedComponent,
  createTextComponent,
  LI,
  UL,
} from '~/ui/components/Text';
import { TextElement } from '~/ui/components/Text/types';

import { formatSchema } from './helpers';
import { FormattedProperty, Property } from './types';

export type AppConfigSchemaProps = {
  schema: Record<string, Property>;
};

export default function AppConfigSchemaTable({ schema }: AppConfigSchemaProps) {
  const formattedSchema = formatSchema(Object.entries(schema));

  return (
    <div>
      {formattedSchema.map((formattedProperty, index) => (
        <AppConfigProperty
          key={`${formattedProperty.name}-${index}`}
          nestingLevel={0}
          {...formattedProperty}
        />
      ))}
    </div>
  );
}

type PropertyNameProps = { name: string; nestingLevel: number };

const PROPERTY_HEADING_CLASSNAME = 'font-normal text-base [&_strong]:break-words';
const PropertyHeadingH3 = createTextComponent(TextElement.H3, PROPERTY_HEADING_CLASSNAME);
const PropertyHeadingH4 = createTextComponent(TextElement.H4, PROPERTY_HEADING_CLASSNAME);
const PropertyHeadingH5 = createTextComponent(TextElement.H5, PROPERTY_HEADING_CLASSNAME);

const AnchorH3 = createPermalinkedComponent(PropertyHeadingH3, {
  baseNestingLevel: 3,
  sidebarType: HeadingType.INLINE_CODE,
});
const AnchorH4 = createPermalinkedComponent(PropertyHeadingH4, {
  baseNestingLevel: 3,
  sidebarType: HeadingType.INLINE_CODE,
});
const AnchorH5 = createPermalinkedComponent(PropertyHeadingH5, {
  baseNestingLevel: 3,
  sidebarType: HeadingType.INLINE_CODE,
});

const PROPERTY_ANCHORS = [AnchorH3, AnchorH4, AnchorH5];

function PropertyName({ name, nestingLevel }: PropertyNameProps) {
  const Anchor = PROPERTY_ANCHORS[Math.min(nestingLevel, PROPERTY_ANCHORS.length - 1)];
  return (
    <Anchor level={nestingLevel}>
      <code className="font-medium">{name}</code>
    </Anchor>
  );
}

function AppConfigProperty({
  name,
  description,
  example,
  bareWorkflow,
  type,
  nestingLevel,
  subproperties,
  parent,
}: FormattedProperty & { nestingLevel: number }) {
  const canHaveMultipleValues = Array.isArray(type);
  return (
    <APIBox
      className={mergeClasses(
        '!mb-0 !rounded-none !border-b-0 !shadow-none',
        '[&]:first-of-type:!rounded-t-md',
        '[&]:last-of-type:!rounded-b-md [&]:last-of-type:!border-b [&]:last-of-type:!border-default',
        'px-4 py-3'
      )}>
      <PropertyName name={name} nestingLevel={nestingLevel} />
      <div className="my-3" data-text="true">
        {canHaveMultipleValues ? (
          <div className="mb-2 grid grid-cols-1">
            <CALLOUT theme="secondary" tag="span">
              One of types:
            </CALLOUT>
            <UL className="[&>li]:leading-loose">
              {type.map((oneOfType, index) => {
                const typeData = JSON.parse(oneOfType);

                if (typeData.type === 'string') {
                  return (
                    <LI theme="secondary" className="text-sm" key={`${name}-string-${index}`}>
                      {typeData.pattern ? (
                        <>
                          <CODE>string</CODE> matching the following pattern:{' '}
                          <code className="text-sm text-default">{typeData.pattern}</code>
                        </>
                      ) : (
                        <CODE>string</CODE>
                      )}
                    </LI>
                  );
                } else if (typeData.type === 'object' && typeData.properties) {
                  return (
                    <LI theme="secondary" className="text-sm" key={`${name}-object-${index}`}>
                      <span className="mb-2 block">
                        An <CODE>object</CODE> with the following properties:
                      </span>
                      {Object.keys(typeData.properties).map((key: string) => {
                        const subTypeData = typeData.properties[key];
                        return (
                          <AppConfigProperty
                            description={
                              subTypeData.enum
                                ? [
                                    subTypeData.description,
                                    `Valid values: ${subTypeData.enum.map((value: string) => `\`${value}\``).join(', ')}.`,
                                  ]
                                    .filter(Boolean)
                                    .join('')
                                : subTypeData.description
                            }
                            type={subTypeData.enum ? 'enum' : subTypeData.type}
                            parent={parent ? `${parent}.${name}` : name}
                            name={key}
                            key={`${key}-${name}-${index}`}
                            subproperties={[]}
                            nestingLevel={nestingLevel + 1}
                          />
                        );
                      })}
                    </LI>
                  );
                } else {
                  return (
                    <CodeBlock
                      className="text-balance text-secondary"
                      inline
                      key={`${name}-${index}`}>
                      {oneOfType}
                    </CodeBlock>
                  );
                }
              })}
            </UL>
          </div>
        ) : (
          <CALLOUT theme="secondary" tag="span">
            Type: <CODE>{type ?? 'undefined'}</CODE>
          </CALLOUT>
        )}
        {!canHaveMultipleValues && nestingLevel > 0 && (
          <CALLOUT theme="secondary" tag="span">
            &emsp;&bull;&emsp;Path:{' '}
            <code className="break-words px-1 text-secondary">
              {parent}.{name}
            </code>
          </CALLOUT>
        )}
      </div>
      <ReactMarkdown components={mdComponents}>{description}</ReactMarkdown>
      {bareWorkflow && (
        <Collapsible summary="Existing React Native app?">
          <ReactMarkdown components={mdComponents}>{bareWorkflow}</ReactMarkdown>
        </Collapsible>
      )}
      {example && (
        <span className="mb-6 grid grid-cols-1 gap-2">
          <CALLOUT theme="secondary" className="font-bold">
            Example
          </CALLOUT>
          <CodeBlock inline>{JSON.stringify(example, null, 2)}</CodeBlock>
        </span>
      )}
      {subproperties &&
        subproperties.length > 0 &&
        subproperties.map((formattedProperty, index) => (
          <AppConfigProperty
            key={`${name}-${formattedProperty.name}-${index}`}
            nestingLevel={nestingLevel + 1}
            {...formattedProperty}
          />
        ))}
    </APIBox>
  );
}
