import { spawn } from 'node:child_process';

const tasks = [
  { name: 'versions-schema-sync', cmd: 'node', args: ['./scripts/fetch-versions-schema.js'] },
  { name: 'append-last-modified-dates', cmd: 'node', args: ['./scripts/append-dates.js'] },
  { name: 'copy-latest', cmd: 'node', args: ['./scripts/copy-latest.js'] },
];

const results = await Promise.allSettled(
  tasks.map(
    ({ name, cmd, args }) =>
      new Promise((resolve, reject) => {
        const child = spawn(cmd, args, { stdio: 'inherit' });
        child.on('close', code => {
          if (code !== 0) {
            reject(new Error(`${name} exited with code ${code}`));
          } else {
            resolve();
          }
        });
        child.on('error', reject);
      })
  )
);

const failures = results.filter(r => r.status === 'rejected');
if (failures.length > 0) {
  for (const f of failures) {
    console.error(f.reason.message);
  }
  process.exit(1);
}
