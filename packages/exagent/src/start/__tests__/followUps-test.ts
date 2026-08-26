// @ref llp/0005-runtime-loop-tools.rfc.md §Where a device reaches the dev server
//
// Whether the run was asked for a tunnel is read from the arguments, and it has to be: the tunnel
// host is not known until the dev server has come up, seconds after the ladder is printed. Both
// spellings are the Expo CLI's, so a run started either way gets the same ladder.

import { requestsTunnel } from '../followUps';

describe(requestsTunnel, () => {
  it.each([
    ['--tunnel', ['start', '--tunnel', '--go']],
    ['--host tunnel', ['start', '--host', 'tunnel']],
    ['--host=tunnel', ['start', '--host=tunnel']],
  ])(`reads %s as a tunnelled run`, (_name, args) => {
    expect(requestsTunnel(args)).toBe(true);
  });

  it.each([
    ['no host flag at all', ['start', '--go']],
    ['another host type', ['start', '--host', 'lan']],
    ['a flag that merely contains the word', ['start', '--tunnel-nothing']],
  ])(`reads %s as a local run`, (_name, args) => {
    expect(requestsTunnel(args)).toBe(false);
  });

  // Everything after `--` belongs to another tool, which is how every other argument reader in this
  // CLI treats the separator.
  it(`stops at the argument separator`, () => {
    expect(requestsTunnel(['start', '--', '--tunnel'])).toBe(false);
  });
});
