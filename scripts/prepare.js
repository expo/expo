#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

const precommit = path.resolve(__dirname, '../.git/hooks/pre-commit');

const hook = `
#!/bin/sh
[ -f node_modules/.bin/lint-staged ] || exit 0
exec node_modules/.bin/lint-staged --quiet --relative
`.trim();

// In git worktrees `.git` is a file rather than a directory and hooks are
// shared from the main checkout, so there's nothing to write here
if (fs.existsSync(path.dirname(precommit))) {
  fs.writeFileSync(precommit, hook);
  fs.chmodSync(precommit, '755');
}
