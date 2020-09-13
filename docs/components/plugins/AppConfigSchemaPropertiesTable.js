import * as React from 'react';
import { css } from 'react-emotion';
import { InlineCode } from '~/components/base/code';
import MDX from '@mdx-js/runtime';
import * as components from '~/common/translate-markdown';

import { expoColors } from '~/constants/theme';

const STYLES_TABLE = css`
  font-size: 1rem;
  margin-top: 24px;
`;

const STYLES_HEAD = css`
  background-color: ${expoColors.gray[100]};
`;

const STYLES_DESCRIPTION_CELL = css`
  word-break: break-word;
  white-space: break-spaces;
  padding-bottom: 0.2rem;
`;

export function formatSchema(rawSchema) {
  const formattedSchema = [];

  rawSchema.map(property => {
    appendProperty(formattedSchema, property, 0);
  });

  return formattedSchema;
}

//appends a property and recursivley appends sub-properties
function appendProperty(formattedSchema, property, _nestingLevel) {
  let nestingLevel = _nestingLevel;
  const propertyKey = property[0];
  const propertyValue = property[1];

  if (propertyValue.meta && (propertyValue.meta.deprecated || propertyValue.meta.hidden)) {
    return;
  }

  formattedSchema.push({
    name: nestingLevel
      ? `<subpropertyAnchor><inlineCode>${propertyKey}</inlineCode></subpropertyAnchor>`
      : `<propertyAnchor><inlineCode>${propertyKey}</inlineCode></propertyAnchor>`,
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

export function _getType(propertyValue) {
  if (propertyValue.enum) {
    return 'enum';
  } else {
    return propertyValue.type.toString().replace(',', ' || ');
  }
}

export function createDescription(property) {
  const propertyValue = property[1];

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

export default class AppConfigSchemaPropertiesTable extends React.Component {
  render() {
    var rawSchema = Object.entries(this.props.schema);
    var formattedSchema = formatSchema(rawSchema);

    return (
      <table className={STYLES_TABLE}>
        <thead className={STYLES_HEAD}>
          <tr>
            <td>Property</td>
            <td>Description</td>
          </tr>
        </thead>
        <tbody>
          {formattedSchema.map((property, index) => {
            return (
              <tr key={index}>
                <td>
                  <div
                    data-testid={property.name}
                    style={{
                      marginLeft: `${property.nestingLevel * 32}px`,
                      display: property.nestingLevel ? 'list-item' : 'block',
                      listStyleType: property.nestingLevel % 2 ? 'default' : 'circle',
                      width: 'fit-content',
                      overflowX: 'visible',
                    }}>
                    <MDX components={components}>{property.name}</MDX>
                  </div>
                </td>
                <td className={STYLES_DESCRIPTION_CELL}>
                  <MDX components={components}>{property.description}</MDX>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }
}
