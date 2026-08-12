import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Runs a `claude -p` subprocess inside the workspace and captures its
 * stream-json transcript. An infrastructure failure (non-zero exit or
 * timeout) throws — the caller must error the suite instead of scoring an
 * untouched workspace, which would report FAILs the agent never earned.
 */
export async function runAgentAsync(
  root: string,
  prompt: string,
  timeoutSeconds: number,
  skillLinkName: string
): Promise<void> {
  const transcriptPath = path.join(root, '.eval', 'transcript.jsonl');
  fs.mkdirSync(path.dirname(transcriptPath), { recursive: true });
  const transcript = fs.createWriteStream(transcriptPath);

  // A nested CLAUDECODE env var makes `claude -p` hang silently.
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key !== 'CLAUDECODE')
  ) as NodeJS.ProcessEnv;

  const args = [
    '-p',
    prompt,
    '--output-format',
    'stream-json',
    '--verbose',
    '--dangerously-skip-permissions',
  ];
  const model = process.env.EXPO_SKILL_EVAL_MODEL;
  if (model) {
    args.push('--model', model);
  }

  const exit = await new Promise<{ code: number | null; timedOut: boolean }>((resolve) => {
    const child = spawn('claude', args, { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve({ code: null, timedOut: true });
    }, timeoutSeconds * 1000);
    child.stdout.pipe(transcript);
    child.stderr.pipe(transcript);
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, timedOut: false });
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      transcript.write(`\nharness error: ${error}\n`);
      resolve({ code: -1, timedOut: false });
    });
  });
  transcript.end();

  if (exit.timedOut || exit.code !== 0) {
    throw new Error(
      exit.timedOut
        ? `Agent run timed out after ${timeoutSeconds}s — transcript: ${transcriptPath}`
        : `Agent run failed (claude exited with ${exit.code}) — transcript: ${transcriptPath}`
    );
  }

  const skillWasRead = fs.readFileSync(transcriptPath, 'utf8').includes(skillLinkName);
  console.info(`agent finished; skill ${skillWasRead ? 'was' : 'was NOT'} read`);
}
