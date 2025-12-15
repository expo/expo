export const enum DependencyResolutionSource {
  RECURSIVE_RESOLUTION,
  SEARCH_PATH,
  RN_CLI_LOCAL,
}

export interface BaseDependencyResolution {
  name: string;
  version: string;
  path: string;
  originPath: string;
}

export interface DependencyResolution extends BaseDependencyResolution {
  source: DependencyResolutionSource;
  duplicates: BaseDependencyResolution[] | null;
  depth: number;
  [prop: string]: unknown;
}

export type ResolutionResult = Record<string, DependencyResolution | undefined>;
