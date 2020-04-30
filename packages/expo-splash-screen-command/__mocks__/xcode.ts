'use strict';
import { fs } from 'memfs';

const { project } = jest.requireActual('xcode');
const parser = require('xcode/lib/parser/pbxproj');

// Original implementation delegates parsing to subprocess and I couldn't find how to mock `fs` in subprocess
// It can be found in `xcode/lib/parserJob`
project.prototype.parse = function(cb) {
  try {
    const fileContents = fs.readFileSync(this.filepath, 'utf-8');
    this.hash = parser.parse(fileContents);
    cb(this.hash);
  } catch (e) {
    cb(null, e);
  }

  return this;
};

module.exports = { project };
