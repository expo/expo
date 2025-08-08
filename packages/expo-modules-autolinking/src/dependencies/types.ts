export interface DependencyResolution {
  name: string;
  version: string;
  path: string;
  originPath: string;
  duplicates: string[] | null;
  depth: number;
  [prop: string]: unknown;
}

export type ResolutionResult = Record<string, DependencyResolution | undefined>;
