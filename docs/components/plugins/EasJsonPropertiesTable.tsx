import * as React from 'react';
import ReactMarkdown from 'react-markdown';

import { createPermalinkedComponent } from '~/common/create-permalinked-component';
import { HeadingType } from '~/common/headingManager';
import { InlineCode } from '~/components/base/code';
import { PDIV } from '~/components/base/paragraph';
import { mdInlineComponentsNoValidation } from '~/components/plugins/api/APISectionUtils';
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

const Anchor = createPermalinkedComponent(PDIV, {
  baseNestingLevel: 3,
  sidebarType: HeadingType.InlineCode,
});

const PropertyName = ({ name, nestingLevel }: Pick<FormattedProperty, 'name' | 'nestingLevel'>) => (
  <Anchor level={nestingLevel}>
    <InlineCode>{name}</InlineCode>
  </Anchor>
);

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
    name: property.name,
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
                    <PropertyName name={property.name} nestingLevel={property.nestingLevel} />
                  </div>
                </Cell>
                <Cell>
                  <ReactMarkdown components={mdInlineComponentsNoValidation}>
                    {property.description}
                  </ReactMarkdown>
                </Cell>
              </Row>
            );
          })}
        </tbody>
      </Table>
    );
  }
}
