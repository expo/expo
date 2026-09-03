'use strict';
module.exports = {
  EOL: '\n',
  platform: () => 'darwin',
  arch: () => 'arm64',
  type: () => 'Darwin',
  release: () => '25.0.0',
  tmpdir: () => '/tmp',
  homedir: () => '/home/jsc',
  hostname: () => 'jsc',
  cpus: () => [],
  availableParallelism: () => 1,
  totalmem: () => 0,
  freemem: () => 0,
  userInfo: () => ({ username: 'jsc', homedir: '/home/jsc' }),
  endianness: () => 'LE',
  networkInterfaces: () => ({}),
};
