export interface BaseDependencyResolution {
  name: string;
  version: string;
  path: string;
  originPath: string;
}

export interface DependencyResolution extends BaseDependencyResolution {
  duplicates: BaseDependencyResolution[] | null;
  depth: number;
  [prop: string]: unknown;
}

export type ResolutionResult = Record<string, DependencyResolution | undefined>;
