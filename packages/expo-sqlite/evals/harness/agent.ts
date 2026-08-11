import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export interface AgentRunOptions {
  workspace: string;
  prompt: string;
  model?: string;
  timeoutSeconds: number;
}

export interface AgentRunResult {
  exitCode: number | null;
  timedOut: boolean;
  /** Absolute path to the captured stream-json transcript. */
  transcriptPath: string;
  /** Whether the transcript shows the agent reading the expo-sqlite skill. */
  skillWasRead: boolean;
}

/**
 * Runs a `claude -p` subprocess inside the workspace. The subprocess pattern
 * (rather than an in-session subagent) keeps the agent outside this session's
 * permission system and matches how Expo's skill-eval harnesses run executors.
 */
export async function runAgentAsync(options: AgentRunOptions): Promise<AgentRunResult> {
  const transcriptPath = path.join(options.workspace, '.eval', 'transcript.jsonl');
  fs.mkdirSync(path.dirname(transcriptPath), { recursive: true });
  const transcript = fs.createWriteStream(transcriptPath);

  const args = [
    '-p',
    options.prompt,
    '--output-format',
    'stream-json',
    '--verbose',
    '--dangerously-skip-permissions',
  ];
  if (options.model) {
    args.push('--model', options.model);
  }

  // A nested CLAUDECODE env var makes `claude -p` hang silently.
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key !== 'CLAUDECODE')
  ) as NodeJS.ProcessEnv;

  const exit = await new Promise<{ exitCode: number | null; timedOut: boolean }>((resolve) => {
    const child = spawn('claude', args, {
      cwd: options.workspace,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve({ exitCode: null, timedOut: true });
    }, options.timeoutSeconds * 1000);
    child.stdout.pipe(transcript);
    child.stderr.pipe(transcript);
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ exitCode: code, timedOut: false });
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      transcript.write(`\nharness error: ${error}\n`);
      resolve({ exitCode: -1, timedOut: false });
    });
  });

  transcript.end();
  const contents = fs.readFileSync(transcriptPath, 'utf8');
  return {
    ...exit,
    transcriptPath,
    // The skill is linked at .claude/skills/npm-expo-sqlite-expo-sqlite/SKILL.md;
    // any Read/Skill tool call naming it shows up in the stream-json transcript.
    skillWasRead: contents.includes('npm-expo-sqlite-expo-sqlite'),
  };
}
