import type { Module } from '@expo/metro/metro/DeltaBundler/types';

export type ChunkingStrategy = 'granular' | 'legacy';
export type AsyncModulePath = string | readonly string[];
export type AsyncModulePaths = Record<string, AsyncModulePath>;

export type SerialAsset = {
  // 'styles.css'
  originFilename: string;
  // '_expo/static/css/bc6aa0a69dcebf8e8cac1faa76705756.css'
  filename: string;
  // '\ndiv {\n    background: cyan;\n}\n\n'
  source: string;
  type: 'css-external' | 'css' | 'js' | 'map' | 'json';

  metadata: {
    chunkingStrategy?: ChunkingStrategy;
    /** Absolute entry module paths represented by this file. Empty for runtime, shared, and worker chunks. */
    entryPaths?: string[];
    /**
     * Entry module paths to required JS filenames, stored on the initial asset.
     * Excludes the initial chunk, but includes files an importer may already have loaded.
     * Runtime dependencies are recorded separately in asset `requires` lists.
     */
    entryChunks?: Record<string, string[]>;
    hmrId?: string;
    /** Media query for a `css-external` stylesheet (e.g. `screen and (min-width: 900px)`). */
    media?: string;
    isAsync?: boolean;
    modulePaths?: string[];
    paths?: Record<string, AsyncModulePaths>;
    // React server action reference from the static babel pass of client modules.
    reactServerReferences?: string[];
    // React client reference from the static babel pass.
    reactClientReferences?: string[];
    // DOM Component references from the static babel pass.
    expoDomComponentReferences?: string[];
    // File paths of route modules that have loader exports.
    loaderReferences?: string[];
    requires?: string[];
  };
};

export function getModuleReferences(modules: Iterable<Module>) {
  const dependencies = [...modules];
  return {
    expoDomComponentReferences: collectOutputReferences(dependencies, 'expoDomComponentReference'),
    reactClientReferences: collectOutputReferences(dependencies, 'reactClientReference'),
    reactServerReferences: collectOutputReferences(dependencies, 'reactServerReference'),
    loaderReferences: collectOutputReferences(dependencies, 'loaderReference'),
  };
}

function collectOutputReferences(modules: readonly Module[], key: string): string[] {
  const references = new Set<string>();
  for (const module of modules) {
    for (const output of module.output) {
      // TODO: This is a mess. This needs to be properly typed
      const data = output.data as Record<string, unknown>;
      if (typeof data[key] === 'string') references.add(data[key]);
    }
  }
  return [...references];
}
