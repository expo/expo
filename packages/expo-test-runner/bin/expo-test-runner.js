#!/usr/bin/env node
'use strict';

// Have to force color support — logs wouldn't have colors when spawned by another process.
// It must be set before `supports-color` (`chalk` dependency) module is imported.
process.env.FORCE_COLOR = 'true';

require('../build');
