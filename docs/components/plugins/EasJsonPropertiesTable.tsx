import MDX from '@mdx-js/runtime';
import * as React from 'react';

import * as components from '~/common/translate-markdown';
import { Cell, HeaderCell, Row, Table, TableHead } from '~/ui/components/Table';

export type Property = {
  description?: string[];
  name: string;
  type?: string | string[];
  enum?: string[];
  properties?: Property[];
};

type FormattedProperty = {
  name: string;
  description: string;
  nestingLevel: number;
};

export function formatSchema(rawSchema: Property[]) {
  const formattedSchema: FormattedProperty[] = [];

  rawSchema.map(property => {
    appendProperty(formattedSchema, property, 0);
  });

  return formattedSchema;
}

//appends a property and recursively appends sub-properties
function appendProperty(
  formattedSchema: FormattedProperty[],
  property: Property,
  _nestingLevel: number
) {
  let nestingLevel = _nestingLevel;

  formattedSchema.push({
    name: nestingLevel
      ? `<subpropertyAnchor level={${nestingLevel}}><inlineCode>${property.name}</inlineCode></subpropertyAnchor>`
      : `<propertyAnchor level={0}><inlineCode>${property.name}</inlineCode></propertyAnchor>`,
    description: createDescription(property),
    nestingLevel,
  });

  nestingLevel++;

  if (property.properties) {
    (property.properties ?? []).forEach(subproperty => {
      appendProperty(formattedSchema, subproperty, nestingLevel);
    });
  }
}

export function _getType(property: Property) {
  if (property.enum) {
    return `enum: ${property.enum.join(', ')}`;
  } else {
    return property.type?.toString().replace(/,/g, ' || ');
  }
}

export function createDescription(property: Property) {
  let propertyDescription = `**(${_getType(property)})**`;
  if (property.description) {
    propertyDescription += ` - ` + property.description.join('\n');
  }

  return propertyDescription;
}

export default class EasJsonPropertiesTable extends React.Component<{
  schema: Property[];
}> {
  render() {
    const formattedSchema = formatSchema(this.props.schema);

    return (
      <Table>
        <TableHead>
          <Row>
            <HeaderCell>Property</HeaderCell>
            <HeaderCell>Description</HeaderCell>
          </Row>
        </TableHead>
        <tbody>
          {formattedSchema.map((property, index) => {
            return (
              <Row key={index}>
                <Cell fitContent>
                  <div
                    data-testid={property.name}
                    style={{
                      marginLeft: `${property.nestingLevel * 32}px`,
                      display: property.nestingLevel ? 'list-item' : 'block',
                      listStyleType: property.nestingLevel % 2 ? 'default' : 'circle',
                      overflowX: 'visible',
                    }}>
                    <MDX components={components}>{property.name}</MDX>
                  </div>
                </Cell>
                <Cell>
                  <MDX components={components}>{property.description}</MDX>
                </Cell>
              </Row>
            );
          })}
        </tbody>
      </Table>
    );
  }
}
