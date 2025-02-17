// Copyright 2015-present 650 Industries. All rights reserved.

import { getBundleUrl } from '../utils/getBundleUrl';

/**
 * Registry to handle import.meta functionality for React Native environment
 * Similar to how it works in the web, but adapted for the RN context
 * https://github.com/wintercg/import-meta-registry
 */
class ImportMetaRegistryClass {
  public readonly url = getBundleUrl();

  public readonly env = process.env;
}

export const ImportMetaRegistry = new ImportMetaRegistryClass();
