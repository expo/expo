/**
 * These Expo packages may have side-effects and should not be lazily initialized.
 */
'use strict';

module.exports = require('./build/lazyImports').lazyImports;
