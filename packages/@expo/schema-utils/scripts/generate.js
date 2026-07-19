#!/usr/bin/env node

const { compile } = require('json-schema-to-typescript');
const fs = require('node:fs');
const path = require('node:path');

const JSON_SCHEMA_SCHEMA_URL = 'https://json-schema.org/draft-04/schema';

async function fetchSchemaAsync() {
  const response = await fetch(JSON_SCHEMA_SCHEMA_URL);
  return {
    ...(await response.json()),
    // Discard embedded id to use generated name
    id: undefined,
  };
}

(async () => {
  const schema = await fetchSchemaAsync();
  const ts = await compile(schema, 'JSONSchema', {
    bannerComment: '/* eslint:disable */',
    declareExternallyReferenced: true,
    enableConstEnums: true,
    inferStringEnumKeysFromValues: true,
    strictIndexSignatures: true,
    unreachableDefinitions: true,
    unknownAny: true,
  });
  const target = path.join(__dirname, '../src/JSONSchema.ts');
  await fs.promises.writeFile(target, ts, 'utf8');
})();
