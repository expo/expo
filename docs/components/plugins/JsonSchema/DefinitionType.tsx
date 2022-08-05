import { DefinitionRenderProps } from './Definition';
import { resolveRef } from './utils/reference';
import { Schema, SchemaProperty } from './utils/types';

import { CODE } from '~/ui/components/Text';

export function DefinitionType(props: DefinitionRenderProps) {
  const type = getPropertyType(props.schema, props.definition);
  return !type ? null : <CODE css={{ whiteSpace: 'nowrap' }}>{type}</CODE>;
}

/**
 * Get the type of a single JSON Schema property to render.
 * For primitive types, the text is returned.
 * For complex types, such as array, the `items` types are resolved.
 */
export function getPropertyType(
  schema: Schema,
  property: SchemaProperty | null,
  expandEnum = true
): null | string {
  const definition = property && property.$ref ? resolveRef(schema, property.$ref) : property;

  if (!definition) {
    return null;
  }

  if (definition.const) {
    return definition.const;
  }

  if (definition.enum) {
    return !expandEnum ? 'enum' : 'enum: ' + definition.enum.join(', ');
  }

  if (definition.oneOf || definition.anyOf) {
    const list = definition.oneOf || definition.anyOf;
    return (list as any[])
      .map((subDef: any) => getPropertyType(schema, subDef, false))
      .filter((value, index, list) => value && list.indexOf(value) === index)
      .join('|');
  }

  if (
    definition.type === 'string' &&
    definition.format &&
    ['date', 'date-time'].includes(definition.format)
  ) {
    return 'Date';
  }

  if (definition.type === 'array') {
    if (!definition.items) return 'array';

    if ('oneOf' in definition.items || 'anyOf' in definition.items) {
      const types = getPropertyType(schema, definition.items, false);
      return `(${types})[]`;
    }

    if (!Array.isArray(definition.items)) {
      return getPropertyType(schema, definition.items) + '[]';
    }

    // Does not work nicely for categories
    // if (Array.isArray(definition.items)) {
    //   const types = definition.items.map(subDef => getPropertyType(schema, subDef, false));
    //   return `[${uniq(types).join('|')}]`;
    // }

    return 'array'; // TODO(cedric): check inside types
  }

  if (definition.type) {
    return definition.type;
  }

  // Fallback
  return '?';
}
