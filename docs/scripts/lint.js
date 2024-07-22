import { spawnSync } from 'node:child_process';

const isDev = process.env.NODE_ENV !== 'production';
const scriptArgs = process.argv.slice(2);

const { status, stderr } = spawnSync(
  'eslint',
  isDev
    ? [
        process.cwd(),
        '--ext=js,cjs,ts,jsx,tsx,md,mdx',
        '--exit-on-fatal-error',
        '--cache',
        '--cache-location',
        '.eslintcache',
        ...scriptArgs,
      ]
    : [process.cwd(), '--ext=js,cjs,ts,jsx,tsx,md,mdx', '--exit-on-fatal-error', ...scriptArgs],
  { stdio: ['inherit', 'inherit', 'pipe'] }
);

if (stderr.byteLength > 0) {
  console.error(`\x1b[31m${stderr.toString()}\x1b[0m`);
}

process.exit(status);
