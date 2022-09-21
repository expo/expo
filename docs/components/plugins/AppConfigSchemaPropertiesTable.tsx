import * as React from 'react';
import ReactMarkdown from 'react-markdown';

import { InlineCode } from '../base/code';

import { createPermalinkedComponent } from '~/common/create-permalinked-component';
import { HeadingType } from '~/common/headingManager';
import { PDIV } from '~/components/base/paragraph';
import { mdComponents, mdInlineComponents } from '~/components/plugins/api/APISectionUtils';
import { Collapsible } from '~/ui/components/Collapsible';
import { Cell, HeaderCell, Row, Table, TableHead } from '~/ui/components/Table';

type PropertyMeta = {
  regexHuman?: string;
  deprecated?: boolean;
  hidden?: boolean;
  expoKit?: string;
  bareWorkflow?: string;
};

export type Property = {
  description?: string;
  type?: string | string[];
  meta?: PropertyMeta;
  pattern?: string;
  enum?: string[];
  example?: any;
  exampleString?: string;
  host?: object;
  properties?: Record<string, Property>;
  items?: {
    properties?: Record<string, Property>;
    [key: string]: any;
  };
  uniqueItems?: boolean;
  additionalProperties?: boolean;
};

type FormattedProperty = {
  name: string;
  description: string;
  nestingLevel: number;
  type?: string;
  example?: string;
  expoKit?: string;
  bareWorkflow?: string;
};

type AppConfigSchemaProps = {
  schema: Record<string, Property>;
};

const Anchor = createPermalinkedComponent(PDIV, {
  baseNestingLevel: 3,
  sidebarType: HeadingType.InlineCode,
});

const PropertyName = ({ name, nestingLevel }: Pick<FormattedProperty, 'name' | 'nestingLevel'>) => (
  <Anchor level={nestingLevel}>
    <InlineCode>{name}</InlineCode>
  </Anchor>
);

export function formatSchema(rawSchema: [string, Property][]) {
  const formattedSchema: FormattedProperty[] = [];

  rawSchema.map(property => {
    appendProperty(formattedSchema, property, 0);
  });

  return formattedSchema;
}

// Appends a property and recursively appends sub-properties
function appendProperty(
  formattedSchema: FormattedProperty[],
  property: [string, Property],
  _nestingLevel: number
) {
  let nestingLevel = _nestingLevel;
  const propertyKey = property[0];
  const propertyValue = property[1];

  if (propertyValue.meta && (propertyValue.meta.deprecated || propertyValue.meta.hidden)) {
    return;
  }

  formattedSchema.push({
    name: propertyKey,
    description: createDescription(property),
    nestingLevel,
    type: _getType(propertyValue),
    example: propertyValue.exampleString,
    expoKit: propertyValue?.meta?.expoKit,
    bareWorkflow: propertyValue?.meta?.bareWorkflow,
  });

  nestingLevel++;

  if (propertyValue.properties) {
    Object.entries(propertyValue.properties).forEach(subproperty => {
      appendProperty(formattedSchema, subproperty, nestingLevel);
    });
  } //Note: sub-properties are sometimes nested within "items"
  else if (propertyValue.items && propertyValue.items.properties) {
    Object.entries(propertyValue.items.properties).forEach(subproperty => {
      appendProperty(formattedSchema, subproperty, nestingLevel);
    });
  }
}

export function _getType(propertyValue: Property) {
  if (propertyValue.enum) {
    return 'enum';
  } else {
    return propertyValue.type?.toString().replace(',', ' || ');
  }
}

export function createDescription(propertyEntry: [string, Property]) {
  const propertyValue = propertyEntry[1];

  let propertyDescription = `**(${_getType(propertyValue)})**`;
  if (propertyValue.description) {
    propertyDescription += ` - ` + propertyValue.description;
  }
  if (propertyValue.meta && propertyValue.meta.regexHuman) {
    propertyDescription += `\n\n` + propertyValue.meta.regexHuman;
  }

  return propertyDescription;
}

const AppConfigSchemaPropertiesTable = ({ schema }: AppConfigSchemaProps) => {
  const rawSchema = Object.entries(schema);
  const formattedSchema = formatSchema(rawSchema);

  return (
    <Table>
      <TableHead>
        <Row>
          <HeaderCell>Property</HeaderCell>
          <HeaderCell>Description</HeaderCell>
        </Row>
      </TableHead>
      <tbody>
        {formattedSchema.map(
          ({ name, description, nestingLevel, type, example, expoKit, bareWorkflow }, index) => (
            <Row key={index}>
              <Cell fitContent>
                <div
                  data-testid={name}
                  style={{
                    marginLeft: `${nestingLevel * 32}px`,
                    display: nestingLevel ? 'list-item' : 'block',
                    listStyleType: nestingLevel % 2 ? 'default' : 'circle',
                    overflowX: 'visible',
                  }}>
                  <PropertyName name={name} nestingLevel={nestingLevel} />
                </div>
              </Cell>
              <Cell>
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
                  <ReactMarkdown components={mdInlineComponents}>
                    {`> ${example.replaceAll('\n', '')}`}
                  </ReactMarkdown>
                )}
              </Cell>
            </Row>
          )
        )}
      </tbody>
    </Table>
  );
};

export default AppConfigSchemaPropertiesTable;
