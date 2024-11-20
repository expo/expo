import { mergeClasses } from '@expo/styleguide';
import ReactMarkdown from 'react-markdown';

import { formatSchema } from './helpers';
import { FormattedProperty, Property } from './types';

import { HeadingType } from '~/common/headingManager';
import { CodeBlock } from '~/components/base/code';
import { APIBox } from '~/components/plugins/APIBox';
import { mdComponents } from '~/components/plugins/api/APISectionUtils';
import { Collapsible } from '~/ui/components/Collapsible';
import { P, CALLOUT, CODE, createPermalinkedComponent, LI, UL } from '~/ui/components/Text';

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
      <code className="font-medium">{name}</code>
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
  const canHaveMultipleValues = Array.isArray(type);
  return (
    <APIBox
      className={mergeClasses(
        '!mb-0 !rounded-none !border-b-0 !shadow-none',
        '[&]:first-of-type:!rounded-t-md',
        '[&]:last-of-type:!rounded-b-md [&]:last-of-type:!border-b [&]:last-of-type:!border-default'
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
            {...formattedProperty}
            key={`${name}-${formattedProperty.name}-${index}`}
            nestingLevel={nestingLevel + 1}
          />
        ))}
    </APIBox>
  );
}
