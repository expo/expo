const fs = require('node:fs');

const attemptFile = process.argv[2];
const failingAttempts = Number(process.argv[3]);

let attempt = 0;
try {
  attempt = Number(fs.readFileSync(attemptFile, 'utf8')) || 0;
} catch {
  attempt = 0;
}
fs.writeFileSync(attemptFile, String(++attempt));

if (attempt <= failingAttempts) {
  process.stderr.write(
    '* daemon not running; starting now at tcp:5037\n' +
      'adb: failed to check server version: cannot connect to daemon at tcp:5037: Connection refused\n'
  );
  process.exitCode = 1;
} else {
  process.stdout.write('List of devices attached\nUSB-1 device usb:1 model:Pixel transport_id:4\n');
  process.stderr.write('* daemon started successfully\n');
}
