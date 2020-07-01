import * as React from 'react';
import { css } from 'react-emotion';
import { InlineCode } from '~/components/base/code';
import MDX from '@mdx-js/runtime';
import * as components from '~/common/translate-markdown';

const STYLES_TABLE = css`
  font-size: 1rem;
  margin-top: 24px;
`;

const STYLES_DESCRIPTION_CELL = css`
  word-break: break-word;
  white-space: break-spaces;
`;

//appends a property and recursivley calls itself to append sub-properties, accounting for nested "level"
function appendProp(formattedSchema, property, _level) {
  let level = _level;
  const propertyKey = property[0];
  const propertyValue = property[1];

  //don't append deprecated or "hidden" properties
  if (propertyValue.meta && (propertyValue.meta.deprecated || propertyValue.meta.hidden)) {
    return;
  }

  //append passed-in property
  formattedSchema.push({
    //The ` quotes are for markdown highlighting, and #### is to apply anchor linking only on top-level properties
    name: level ? `\`${propertyKey}\`` : `#### \`${propertyKey}\``,
    type: propertyValue.enum ? 'enum' : propertyValue.type,
    description: smartlyCreateDescription(property),
    level: level,
  });

  //increase nesting level for sub-properties
  level++;

  //recursively apply appending logic for each sub-property (if any)
  if (propertyValue.properties) {
    Object.entries(propertyValue.properties).forEach(subproperty => {
      appendProp(formattedSchema, subproperty, level);
    });
  }
}

//setting up a property's formatted description value, with all the possible extra values
function smartlyCreateDescription(property) {
  const propertyValue = property[1];

  var propertyDescription = propertyValue.description;
  if (propertyValue.exampleString) {
    propertyDescription += `\n\n` + propertyValue.exampleString;
  }
  if (propertyValue.meta && propertyValue.meta.regexHuman) {
    propertyDescription += `\n\n` + propertyValue.meta.regexHuman;
  }
  if (propertyValue.meta && propertyValue.meta.expoKit) {
    propertyDescription += `\n` + `>**ExpoKit**: ` + propertyValue.meta.expoKit;
  }
  if (propertyValue.meta && propertyValue.meta.bareWorkflow) {
    propertyDescription += `\n` + `>**Bare workflow**: ` + propertyValue.meta.bareWorkflow;
  }

  return propertyDescription;
}

export default class AppJsonPropsTable extends React.Component {
  render() {
    var rawSchema = Object.entries(this.props.schema);
    var formattedSchema = [];

    //appends each schema property (each index will become a tablerow)
    rawSchema.map(property => {
      appendProp(formattedSchema, property, 0);
    });

    return (
      <div>
        <table className={STYLES_TABLE}>
          <thead>
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
                    <InlineCode>{property.type}</InlineCode>
                  </td>
                  <td className={STYLES_DESCRIPTION_CELL}>
                    <MDX components={components}>{property.description}</MDX>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
}
