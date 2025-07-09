// Separated partial Bun types, eliminating the need to install @types/bun in the project.

declare const Bun: {
  build: (config: BuildConfig) => Promise<BuildOutput>;
  argv: string[];
};

interface BuildConfig {
  entrypoints: string[];
  target?: string;
}

interface BuildArtifact extends Blob {
  path: string;
  hash: string | null;
  kind: 'entry-point' | 'chunk' | 'asset' | 'sourcemap';
  sourcemap: BuildArtifact | null;
}

interface BuildOutput {
  outputs: BuildArtifact[];
  success: boolean;
  logs: BuildMessage[];
}

interface BuildMessage {
  message: string;
}
