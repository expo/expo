import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import MDX from '@mdx-js/runtime';
import * as React from 'react';

import * as components from '~/common/translate-markdown';

const STYLES_TABLE = css`
  font-size: 1rem;
  margin-top: 24px;
`;

const STYLES_HEAD = css`
  background-color: ${theme.background.tertiary};
`;

const STYLES_DESCRIPTION_CELL = css`
  word-break: break-word;
  white-space: break-spaces;
  padding-bottom: 0.2rem;
`;

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
    <table css={STYLES_TABLE}>
      <thead css={STYLES_HEAD}>
        <tr>
          <td>Property</td>
          <td>Description</td>
        </tr>
      </thead>
      <tbody>
        {formattedSchema.map(({ name, description, nestingLevel }, index) => (
          <tr key={index}>
            <td>
              <div
                data-testid={name}
                style={{
                  marginLeft: `${nestingLevel * 32}px`,
                  display: nestingLevel ? 'list-item' : 'block',
                  listStyleType: nestingLevel % 2 ? 'default' : 'circle',
                  width: 'fit-content',
                  overflowX: 'visible',
                }}>
                <MDX components={components}>{name}</MDX>
              </div>
            </td>
            <td css={STYLES_DESCRIPTION_CELL}>
              <MDX components={components}>{description}</MDX>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default AppConfigSchemaPropertiesTable;
