// WARN: Internal re-export, don't rely on this to be a public API or use it outside of `expo/expo`'s monorepo
const { installGlobal } = require('../src/winter/installGlobal');
module.exports = {
  installGlobal,
};
