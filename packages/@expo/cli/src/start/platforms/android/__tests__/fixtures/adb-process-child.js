const fs = require('node:fs');

const pidFile = process.argv[2];
fs.writeFileSync(pidFile, String(process.pid));

process.on('SIGTERM', () => {
  // Exercise the runner's escalation path on platforms with catchable SIGTERM.
});

const output = Buffer.alloc(64 * 1024, 'o');
const errorOutput = Buffer.alloc(64 * 1024, 'e');
for (let index = 0; index < 32; index++) {
  process.stdout.write(output);
  process.stderr.write(errorOutput);
}

setInterval(() => {}, 1_000);
