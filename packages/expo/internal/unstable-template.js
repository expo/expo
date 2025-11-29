// WARN: Internal export, don't rely on this to be a public API or use it outside of `expo/expo`'s monorepo
const path = require('path');
module.exports = path.dirname(require.resolve('expo-template-bare-minimum/package.json'));
