export type SupportedPlatform = 'ios' | 'android';

export interface SearchOptions {
  // Available in the CLI
  searchPaths: string[];
  ignorePaths?: string[] | null;
  exclude?: string[] | null;
  platform: SupportedPlatform;

  // Scratched from project's config
  flags?: Record<string, any>;
}

export interface ResolveOptions extends SearchOptions {
  json?: boolean;
}

export interface GenerateOptions extends ResolveOptions {
  target: string;
  namespace: string;
  empty?: boolean;
}

export type PackageRevision = {
  path: string;
  version: string;
  duplicates?: PackageRevision[];
};

export type SearchResults = {
  [moduleName: string]: PackageRevision;
};

export type ModuleDescriptor = Record<string, any>;
