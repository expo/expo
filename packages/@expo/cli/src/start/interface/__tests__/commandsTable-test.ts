import * as Log from '../../../log';
import { printUsage } from '../commandsTable';

jest.mock('../../../log');

const captureOutput = () => {
  return jest
    .mocked(Log.log)
    .mock.calls.map((args) => args.join(' '))
    .join('\n');
};

describe(printUsage, () => {
  beforeEach(() => {
    jest.mocked(Log.log).mockClear();
  });

  it(`hides the keybindings table when minimal is true`, () => {
    printUsage(
      {
        devClient: false,
        isWebSocketsEnabled: true,
        platforms: ['ios', 'android', 'web'],
        minimal: true,
      },
      { verbose: false, rows: 1000 }
    );
    const output = captureOutput();
    expect(output).not.toMatch(/open Android/);
    expect(output).not.toMatch(/open iOS/);
    expect(output).not.toMatch(/open web/);
    expect(output).not.toMatch(/reload app/);
    expect(output).not.toMatch(/open debugger/);
    expect(output).not.toMatch(/open project code in your editor/);
  });

  it(`includes the "Press s to switch" hint when minimal is true`, () => {
    printUsage(
      {
        devClient: false,
        isWebSocketsEnabled: true,
        platforms: ['ios', 'android', 'web'],
        minimal: true,
      },
      { verbose: false, rows: 1000 }
    );
    expect(captureOutput()).toMatch(/Press .*s.* to switch to development build/);
  });

  it(`still prints the full table when verbose is true, even if minimal is true`, () => {
    printUsage(
      {
        devClient: false,
        isWebSocketsEnabled: true,
        platforms: ['ios', 'android', 'web'],
        minimal: true,
      },
      { verbose: true }
    );
    const output = captureOutput();
    expect(output).toMatch(/open Android/);
    expect(output).toMatch(/reload app/);
    expect(output).toMatch(/open project code in your editor/);
  });

  it(`prints the full table by default when rows are sufficient`, () => {
    printUsage(
      { devClient: false, isWebSocketsEnabled: true, platforms: ['ios', 'android', 'web'] },
      { verbose: false, rows: 1000 }
    );
    const output = captureOutput();
    expect(output).toMatch(/open Android/);
    expect(output).toMatch(/reload app/);
  });
});
