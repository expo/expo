import assert from 'assert';
import * as React from 'react';

import { DefinitionDescription } from './DefinitionDescription';
import DefinitionProperties from './DefinitionProperties';
import { resolveRef } from './utils/reference';
import { Schema, SchemaProperty } from './utils/types';

interface DefinitionProps {
  /** The full JSON Schema to render the data from */
  schema: Schema;
  /** The path to the JSON Schema object to render, defaults to root */
  path: string;
}

export interface DefinitionRenderProps {
  /** The full JSON Schema to render the data from */
  schema: Schema;
  /** The resolved JSON Schema definition to render */
  definition: SchemaProperty;
}

export function Definition({ schema, path }: DefinitionProps) {
  const definition = resolveRef(schema, path);
  assert(definition, `Definition was not found in schema, used path: ${path}`);

  return (
    <>
      <DefinitionDescription schema={schema} definition={definition} />
      <br />
      {definition.properties ? (
        <DefinitionProperties schema={schema} definition={definition} />
      ) : null}
    </>
  );
}
