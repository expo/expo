export interface DependencyResolution {
  name: string;
  path: string;
  version: string;
  originPath: string;
  duplicates: string[] | null;
  depth: number;
  [prop: string]: unknown;
}

export type ResolutionResult = Record<string, DependencyResolution | undefined>;
