import assert from 'assert';

import { Schema, SchemaProperty } from './types';

/**
 * Find the referenced JSON Schema property within the schema.
 * This uses paths like `#/definitions/SomeObject` to resolve it.
 */
export function resolveRef(schema: Schema, path: string): null | SchemaProperty {
  assert(path.startsWith('#/'), `A valid JSON Schema path starts with '#/'`);

  const pathSegments = path.replace(/^#\//, '').split('/');
  let pathReference = schema;

  for (const segment of pathSegments) {
    if (!pathReference[segment]) {
      return null;
    }

    pathReference = pathReference[segment];
  }

  return pathReference;
}
