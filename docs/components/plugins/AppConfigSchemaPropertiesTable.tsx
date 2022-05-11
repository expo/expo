import MDX from '@mdx-js/runtime';
import * as React from 'react';

import * as components from '~/common/translate-markdown';
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
};

type AppConfigSchemaProps = {
  schema: Record<string, Property>;
};

export function formatSchema(rawSchema: [string, Property][]) {
  const formattedSchema: FormattedProperty[] = [];

  rawSchema.map(property => {
    appendProperty(formattedSchema, property, 0);
  });

  return formattedSchema;
}

//appends a property and recursivley appends sub-properties
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
    name: nestingLevel
      ? `<subpropertyAnchor level={${nestingLevel}}><inlineCode>${propertyKey}</inlineCode></subpropertyAnchor>`
      : `<propertyAnchor level={0}><inlineCode>${propertyKey}</inlineCode></propertyAnchor>`,
    description: createDescription(property),
    nestingLevel,
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
  if (propertyValue.meta && propertyValue.meta.expoKit) {
    propertyDescription += `<expokitDetails>${propertyValue.meta.expoKit}</expokitDetails>`;
  }
  if (propertyValue.meta && propertyValue.meta.bareWorkflow) {
    propertyDescription += `<bareworkflowDetails>${propertyValue.meta.bareWorkflow}</bareworkflowDetails>`;
  }
  if (propertyValue.exampleString) {
    propertyDescription += `\n\n>` + propertyValue.exampleString;
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
        {formattedSchema.map(({ name, description, nestingLevel }, index) => (
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
                <MDX components={components}>{name}</MDX>
              </div>
            </Cell>
            <Cell>
              <MDX components={components}>{description}</MDX>
            </Cell>
          </Row>
        ))}
      </tbody>
    </Table>
  );
};

export default AppConfigSchemaPropertiesTable;
