import * as React from 'react';
import { css } from 'react-emotion';
import { InlineCode } from '~/components/base/code';
import MDX from '@mdx-js/runtime';
import * as components from '~/common/translate-markdown';

import { expoColors } from '~/common/constants';

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
`;

export function formatSchema(rawSchema) {
  let formattedSchema = [];

  //appends each schema property (each index will become a tablerow)
  rawSchema.map(property => {
    appendProperty(formattedSchema, property, 0);
  });

  return formattedSchema;
}

//appends a property and recursivley calls itself to append sub-properties, accounting for nested "level"
function appendProperty(formattedSchema, property, _level) {
  let level = _level;
  const propertyKey = property[0];
  const propertyValue = property[1];

  //don't append deprecated or "hidden" properties
  if (propertyValue.meta && (propertyValue.meta.deprecated || propertyValue.meta.hidden)) {
    return;
  }

  //append passed-in property
  formattedSchema.push({
    //The ` backticks are for markdown highlighting, and #### is to apply anchor linking only on top-level properties
    name: level ? `\`${propertyKey}\`` : `#### \`${propertyKey}\``,
    type: propertyValue.enum ? 'enum' : propertyValue.type,
    description: createDescription(property),
    level: level,
  });

  //increase nesting level for sub-properties
  level++;

  //recursively apply appending logic for each sub-property (if any) -> Note: sub-props are sometimes nested within "items"
  if (propertyValue.properties) {
    Object.entries(propertyValue.properties).forEach(subproperty => {
      appendProperty(formattedSchema, subproperty, level);
    });
  } else if (propertyValue.items && propertyValue.items.properties) {
    Object.entries(propertyValue.items.properties).forEach(subproperty => {
      appendProperty(formattedSchema, subproperty, level);
    });
  }
}

//setting up a property's formatted description value, with all the possible extra values
export function createDescription(property) {
  const propertyValue = property[1];

  let propertyDescription = propertyValue.description;
  if (propertyValue.exampleString) {
    propertyDescription += `\n\n>` + propertyValue.exampleString;
  }
  if (propertyValue.meta && propertyValue.meta.regexHuman) {
    propertyDescription += `\n\n` + propertyValue.meta.regexHuman;
  }
  if (propertyValue.meta && propertyValue.meta.expoKit) {
    propertyDescription += `\n>**ExpoKit**: ` + propertyValue.meta.expoKit;
  }
  if (propertyValue.meta && propertyValue.meta.bareWorkflow) {
    if (propertyValue.meta.expoKit || propertyValue.exampleString) {
      propertyDescription += `\n`;
    }
    propertyDescription += `\n>**Bare workflow**: ` + propertyValue.meta.bareWorkflow;
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
            <td>Type</td>
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
                      marginLeft: `${12 + property.level * 32}px`,
                      display: property.level ? 'list-item' : 'block',
                      listStyleType: property.level % 2 ? 'default' : 'circle',
                      width: 'fit-content',
                      overflowX: 'visible',
                    }}>
                    <MDX components={components}>{property.name}</MDX>
                  </div>
                </td>
                <td>
                  <InlineCode>{property.type && property.type.toString()}</InlineCode>
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
