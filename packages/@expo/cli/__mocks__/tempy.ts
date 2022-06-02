import crypto from 'crypto';
import os from 'os';
import path from 'path';

module.exports = {
  directory() {
    return path.join(os.tmpdir(), crypto.randomBytes(16).toString('hex'));
  },
  file: jest.fn(({ name }) => '/tmp/' + name),
};
