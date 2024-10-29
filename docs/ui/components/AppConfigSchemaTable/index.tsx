import { Button, mergeClasses } from '@expo/styleguide';
import { CodeSquare01Icon } from '@expo/styleguide-icons/outline/CodeSquare01Icon';
import { SearchSmIcon } from '@expo/styleguide-icons/outline/SearchSmIcon';
import { XIcon } from '@expo/styleguide-icons/outline/XIcon';
import debounce from 'lodash/debounce';
import { useCallback, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import { filterSchemaEntries, flattenProperties, formatSchema } from './helpers';
import { FormattedProperty, Property } from './types';

import { HeadingType } from '~/common/headingManager';
import { CodeBlock } from '~/components/base/code';
import { APIBox } from '~/components/plugins/APIBox';
import { mdComponents } from '~/components/plugins/api/APISectionUtils';
import { Collapsible } from '~/ui/components/Collapsible';
import { Input } from '~/ui/components/Form';
import { P, CALLOUT, CODE, createPermalinkedComponent, MONOSPACE } from '~/ui/components/Text';

export type AppConfigSchemaProps = {
  schema: Record<string, Property>;
};

export default function AppConfigSchemaTable({ schema }: AppConfigSchemaProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');

  const debouncedSearch = useCallback(
    debounce((input: string) => {
      setDebouncedSearchTerm(input);
    }, 200),
    [setDebouncedSearchTerm]
  );

  const formattedSchema =
    debouncedSearchTerm.length > 0
      ? flattenProperties(formatSchema(Object.entries(schema))).filter(entry =>
          filterSchemaEntries(entry, searchTerm)
        )
      : formatSchema(Object.entries(schema));

  return (
    <div className="flex flex-col gap-3.5">
      <div className="relative">
        <SearchSmIcon className="text-icon-tertiary absolute pointer-events-none left-3 top-3.5" />
        <Input
          placeholder="search properties..."
          className="pl-10 my-0"
          value={searchTerm}
          onChange={event => {
            const input = event.target.value;
            setSearchTerm(input);
            debouncedSearch(input);
          }}
          onBlur={() => debouncedSearch.cancel()}
        />
        {debouncedSearchTerm && (
          <Button
            theme="quaternary"
            className="absolute right-2 top-1.5"
            leftSlot={<XIcon className="icon-md" />}
            onClick={() => {
              setSearchTerm('');
              setDebouncedSearchTerm('');
            }}
          />
        )}
      </div>
      <div>
        {formattedSchema.length > 0 ? (
          formattedSchema.map((formattedProperty, index) => (
            <AppConfigProperty
              {...formattedProperty}
              key={`${formattedProperty.name}-${index}`}
              nestingLevel={0}
              searchTerm={debouncedSearchTerm}
            />
          ))
        ) : (
          <div className="rounded-md border border-secondary px-6 py-8 bg-subtle">
            <P className="text-tertiary text-center">
              There are no properties matching given search query.
            </P>
          </div>
        )}
      </div>
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
      <MONOSPACE className="!text-sm">{name}</MONOSPACE>
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
  searchTerm,
  subproperties,
  parent,
}: FormattedProperty & { nestingLevel: number; searchTerm?: string }) {
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
        {(searchTerm || nestingLevel > 0) && (
          <>
            &emsp;&bull;&emsp;Path:{' '}
            <code className="text-secondary px-1 break-words">
              {parent === name ? name : `${parent}.${name}`}
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
          <CALLOUT className="flex flex-row gap-1.5 items-center text-secondary">
            <CodeSquare01Icon className="icon-sm" />
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
            searchTerm={searchTerm}
          />
        ))}
    </APIBox>
  );
}
