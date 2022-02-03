import path from 'path';
import os from 'os';
import crypto from 'crypto';

module.exports = {
  directory() {
    return path.join(os.tmpdir(), crypto.randomBytes(16).toString('hex'));
  },
};
