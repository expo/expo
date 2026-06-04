export type PullRequestRef = {
  repo: string;
  owner: string;
  name: string;
  pullNumber: number;
  headSha: string;
  prUrl?: string;
};

export type PrSandboxJobRequest = PullRequestRef;

export type PrSandboxJob = {
  jobId: string;
  repo: string;
  pullNumber: number;
  headSha: string;
};

export const SANDBOX_PRESETS = [
  'checkout',
  'node_install',
  'node_test',
  'node_lint',
  'node_typecheck',
  'gradle_check',
  'swift_check',
  'cpp_check',
] as const;

export type SandboxPreset = (typeof SANDBOX_PRESETS)[number];

export type SandboxPresetResult = {
  preset: SandboxPreset;
  success: boolean;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  skipped?: boolean;
  error?: string;
};

export type SandboxTaskStatus<T> =
  | {
      taskId: string;
      status: 'running';
      startedAt: string;
      timeout: number;
    }
  | {
      taskId: string;
      status: 'completed';
      startedAt: string;
      finishedAt: string;
      timeout: number;
      result: T;
    }
  | {
      taskId: string;
      status: 'failed';
      startedAt: string;
      finishedAt?: string;
      timeout: number;
      error: string;
    };

export type SandboxCommandRequest = {
  command: string;
  cwd?: string;
  timeout?: number;
};

export type SandboxCommandResult = {
  command: string;
  cwd: string;
  success: boolean;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  error?: string;
};

export type SandboxLogResponse = {
  jobId: string;
  logs: string;
};

export type SandboxReadFileResponse = {
  jobId: string;
  path: string;
  content: string;
};

export type ProjectSnapshot = {
  files: Record<string, string | null | undefined>;
};

export type PrSandboxEvidenceReport = {
  generatedAt: string;
  pullRequest: PullRequestRef;
  jobId: string;
  presets: SandboxPresetResult[];
  logs: string;
  context: string;
};
