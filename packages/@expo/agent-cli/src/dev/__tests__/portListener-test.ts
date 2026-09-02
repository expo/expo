import { parseLsofFields, parseNetstatListener } from '../portListener';

describe(parseLsofFields, () => {
  // `lsof -F` writes one field per line, the first character naming the field. The columns are
  // parsed instead of the default table because a command name with a space in it shifts every
  // column after it, silently.
  it(`should read the pid and the command of one listener`, () => {
    expect(parseLsofFields('p65866\ncnode\n')).toEqual({ pid: 65866, command: 'node' });
  });

  it(`should keep the first listener when a port has more than one`, () => {
    expect(parseLsofFields('p100\ncnode\np200\ncother\n')).toEqual({ pid: 100, command: 'node' });
  });

  it(`should read a command name that has a space in it`, () => {
    expect(parseLsofFields('p42\ncMy App Helper\n')).toEqual({ pid: 42, command: 'My App Helper' });
  });

  it(`should answer null for output with no process record`, () => {
    expect(parseLsofFields('')).toBeNull();
    expect(parseLsofFields('cnode\n')).toBeNull();
  });

  it(`should answer null for a pid that is not a pid`, () => {
    expect(parseLsofFields('pnope\ncnode\n')).toBeNull();
  });
});

describe(parseNetstatListener, () => {
  const output = [
    'Active Connections',
    '',
    '  Proto  Local Address          Foreign Address        State           PID',
    '  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING       988',
    '  TCP    127.0.0.1:8081         0.0.0.0:0              LISTENING       4242',
    '  TCP    127.0.0.1:8082         0.0.0.0:0              LISTENING       7',
    '  TCP    127.0.0.1:8081         127.0.0.1:51234        ESTABLISHED     9999',
  ].join('\n');

  it(`should read the pid of the listener on a port`, () => {
    expect(parseNetstatListener(output, 8081)).toBe(4242);
  });

  // An established connection to the same port is not the listener, and taking its pid would
  // report — and with --force, kill — whatever happened to be talking to the dev server.
  it(`should ignore rows that are not listening`, () => {
    expect(parseNetstatListener(output, 8081)).not.toBe(9999);
  });

  it(`should not match a port that is only a suffix of another`, () => {
    expect(parseNetstatListener(output, 81)).toBeNull();
  });

  it(`should answer null for a port nothing listens on`, () => {
    expect(parseNetstatListener(output, 9999)).toBeNull();
  });
});
