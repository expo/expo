const mode = process.argv[2];

if (mode === 'finite') {
  setTimeout(() => process.stdout.write('completed'), 150);
} else if (mode === 'stream') {
  setInterval(() => process.stdout.write('tick\n'), 10);
} else {
  process.stderr.write(`unknown fixture mode: ${mode}`);
  process.exitCode = 1;
}
