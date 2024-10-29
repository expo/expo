import { FormattedProperty, Property } from './types.js';

export function formatSchema(rawSchema: [string, Property][]) {
  const formattedSchema: FormattedProperty[] = [];

  rawSchema.map(property => {
    appendProperty(formattedSchema, property);
  });

  return formattedSchema;
}

export function appendProperty(formattedSchema: FormattedProperty[], property: [string, Property]) {
  const propertyValue = property[1];

  if (propertyValue.meta && (propertyValue.meta.deprecated || propertyValue.meta.hidden)) {
    return;
  }

  formattedSchema.push(formatProperty(property));
}

export function formatProperty(property: [string, Property], parent?: string): FormattedProperty {
  const propertyKey = property[0];
  const propertyValue = property[1];

  const subproperties: FormattedProperty[] = [];

  if (propertyValue.properties) {
    Object.entries(propertyValue.properties).forEach(subproperty => {
      subproperties.push(
        formatProperty(subproperty, parent ? `${parent}.${propertyKey}` : propertyKey)
      );
    });
  } // note: sub-properties are sometimes nested within "items"
  else if (propertyValue.items && propertyValue.items.properties) {
    Object.entries(propertyValue.items.properties).forEach(subproperty => {
      subproperties.push(
        formatProperty(subproperty, parent ? `${parent}.${propertyKey}` : propertyKey)
      );
    });
  }

  return {
    name: propertyKey,
    description: createDescription(property),
    type: _getType(propertyValue),
    example: propertyValue.example,
    expoKit: propertyValue?.meta?.expoKit,
    bareWorkflow: propertyValue?.meta?.bareWorkflow,
    subproperties,
    parent,
  };
}

export function _getType(property: Partial<Property>) {
  if (property.enum) {
    return 'enum';
  }
  if (property.oneOf) {
    return property.oneOf.map(prop =>
      JSON.stringify({ ...prop, meta: undefined, additionalProperties: undefined }, null, 2)
    );
  }
  return property.type?.toString().replace(',', ' || ');
}

export function createDescription(propertyEntry: [string, Property]) {
  const { description, meta } = propertyEntry[1];

  let propertyDescription = ``;
  if (description) {
    propertyDescription += description;
  }
  if (meta && meta.regexHuman) {
    propertyDescription += `\n\n` + meta.regexHuman;
  }

  return propertyDescription;
}

export function filterSchemaEntries(entry: FormattedProperty, searchTerm?: string) {
  if (!searchTerm) {
    return true;
  }

  return (
    entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

export function flattenProperties(properties: FormattedProperty[]): FormattedProperty[] {
  const flattened: FormattedProperty[] = [];

  function flatten(property: FormattedProperty, parentPath?: string) {
    flattened.push({
      ...property,
      parent: parentPath,
    });

    if (property.subproperties && property.subproperties.length > 0) {
      property.subproperties.forEach(subProp => flatten(subProp, parentPath));
    }
  }

  properties.forEach(property =>
    flatten(property, property.parent ? `${property.parent}.${property.name}` : property.name)
  );

  return flattened;
}
