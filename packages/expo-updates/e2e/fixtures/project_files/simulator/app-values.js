// Reads app values from an agent-device snapshot (`snapshot --json`) on stdin.
//
// Usage:
//   node simulator/app-values.js ID=VALUE...  Exits 0 when each element ID has the text VALUE.
//                                             Otherwise prints each difference and exits 1.
//   node simulator/app-values.js --print ID   Prints the text of element ID. Exits 1 when the
//                                             snapshot has no element ID.

const fs = require('fs');

const snapshot = JSON.parse(fs.readFileSync(0, 'utf8'));
const values = new Map();
for (const node of snapshot.data?.nodes ?? []) {
  if (node.identifier && !values.has(node.identifier)) {
    values.set(node.identifier, node.label ?? node.value ?? '');
  }
}

const args = process.argv.slice(2);
if (args[0] === '--print') {
  if (!values.has(args[1])) {
    console.error(`The app has no element ${args[1]}.`);
    process.exit(1);
  }
  console.log(values.get(args[1]));
  process.exit(0);
}

let matches = true;
for (const arg of args) {
  const separator = arg.indexOf('=');
  const id = arg.slice(0, separator);
  const expected = arg.slice(separator + 1);
  const value = values.has(id) ? JSON.stringify(values.get(id)) : '(no element)';
  if (value !== JSON.stringify(expected)) {
    console.error(`${id}: expected ${JSON.stringify(expected)}, got ${value}`);
    matches = false;
  }
}
process.exit(matches ? 0 : 1);
