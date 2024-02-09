import { JSONObject } from '@expo/json-file';
import fs from 'fs';
import schemaDerefSync from 'json-schema-deref-sync';
import path from 'path';

import { createCachedFetch } from './rest/client';
import { env } from '../utils/env';
import { CommandError } from '../utils/errors';

export type Schema = any;

export type AssetSchema = {
  fieldPath: string;
};

const schemaJson: { [sdkVersion: string]: Schema } = {};

// TODO: Maybe move json-schema-deref-sync out of api (1.58MB -- lodash)
// https://packagephobia.com/result?p=json-schema-deref-sync
async function getSchemaAsync(sdkVersion: string): Promise<Schema> {
  const json = await getSchemaJSONAsync(sdkVersion);
  return schemaDerefSync(json.schema);
}

/**
 * Array of schema nodes that refer to assets along with their field path (eg. 'notification.icon')
 *
 * @param sdkVersion
 */
export async function getAssetSchemasAsync(sdkVersion: string = 'UNVERSIONED'): Promise<string[]> {
  // If no SDK version is available then fall back to unversioned
  const schema = await getSchemaAsync(sdkVersion);
  const assetSchemas: string[] = [];
  const visit = (node: Schema, fieldPath: string) => {
    if (node.meta && node.meta.asset) {
      assetSchemas.push(fieldPath);
    }
    const properties = node.properties;
    if (properties) {
      Object.keys(properties).forEach((property) =>
        visit(properties[property], `${fieldPath}${fieldPath.length > 0 ? '.' : ''}${property}`)
      );
    }
  };
  visit(schema, '');

  return assetSchemas;
}

async function getSchemaJSONAsync(sdkVersion: string): Promise<{ schema: Schema }> {
  if (env.EXPO_UNIVERSE_DIR) {
    return JSON.parse(
      fs
        .readFileSync(
          path.join(
            env.EXPO_UNIVERSE_DIR,
            'server',
            'www',
            'xdl-schemas',
            'UNVERSIONED-schema.json'
          )
        )
        .toString()
    );
  }

  if (!schemaJson[sdkVersion]) {
    try {
      schemaJson[sdkVersion] = await getConfigurationSchemaAsync(sdkVersion);
    } catch (e: any) {
      if (e.code === 'INVALID_JSON') {
        throw new CommandError('INVALID_JSON', `Couldn't read schema from server`);
      }

      throw e;
    }
  }

  return schemaJson[sdkVersion];
}

async function getConfigurationSchemaAsync(sdkVersion: string): Promise<JSONObject> {
  // Reconstruct the cached fetch since caching could be disabled.
  const fetchAsync = createCachedFetch({
    cacheDirectory: 'schema-cache',
    // We'll use a 1 week cache for versions so older versions get flushed out eventually.
    ttl: 1000 * 60 * 60 * 24 * 7,
  });
  const response = await fetchAsync(`project/configuration/schema/${sdkVersion}`);
  const { data } = await response.json();
  return data;
}
