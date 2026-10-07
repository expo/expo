import { removeLoggerFrames } from '../stack';

// Stacks captured in `reportReanimatedLog` in a Release build of observe-tester on the iOS
// simulator (Hermes, Reanimated 4.7.0). The bundle paths are shortened.
const REACT_NATIVE_RUNTIME_STACK = [
  'Error: [Reanimated] Sample error from the React Native runtime (observe-tester)',
  '    at reportReanimatedLog (main.jsbundle:107425:33)',
  '    at handleLog (main.jsbundle:114624:21)',
  '    at error (main.jsbundle:114677:18)',
  '    at run (main.jsbundle:197759:19)',
  '    at runSample (main.jsbundle:197796:19)',
].join('\n');
const UI_RUNTIME_STACK = [
  'Error: [Reanimated] Sample error from the UI runtime (observe-tester)',
  '    at reportReanimatedLog (main.jsbundle:107425:33)',
].join('\n');

describe('removeLoggerFrames', () => {
  it("removes the integration and logger frames so the stack starts at the logger's caller", () => {
    expect(removeLoggerFrames(REACT_NATIVE_RUNTIME_STACK)).toBe(
      [
        'Error: [Reanimated] Sample error from the React Native runtime (observe-tester)',
        '    at run (main.jsbundle:197759:19)',
        '    at runSample (main.jsbundle:197796:19)',
      ].join('\n')
    );
  });

  it('keeps only the message for a log delivered from the UI runtime', () => {
    expect(removeLoggerFrames(UI_RUNTIME_STACK)).toBe(
      'Error: [Reanimated] Sample error from the UI runtime (observe-tester)'
    );
  });

  it.each(['warn', 'warnOnce', 'Object.error'])('removes a `%s` logger frame', (method) => {
    const stack = [
      'Error: [Reanimated] Message',
      '    at reportReanimatedLog (main.jsbundle:1:1)',
      '    at handleLog (main.jsbundle:2:1)',
      `    at ${method} (main.jsbundle:3:1)`,
      '    at caller (main.jsbundle:4:1)',
    ].join('\n');

    expect(removeLoggerFrames(stack)).toBe(
      ['Error: [Reanimated] Message', '    at caller (main.jsbundle:4:1)'].join('\n')
    );
  });

  it('keeps a multi-line message intact', () => {
    const stack = [
      'Error: [Reanimated] Line one',
      '',
      'Line two',
      '    at reportReanimatedLog (main.jsbundle:1:1)',
      '    at handleLog (main.jsbundle:2:1)',
      '    at error (main.jsbundle:3:1)',
      '    at caller (main.jsbundle:4:1)',
    ].join('\n');

    expect(removeLoggerFrames(stack)).toBe(
      ['Error: [Reanimated] Line one', '', 'Line two', '    at caller (main.jsbundle:4:1)'].join(
        '\n'
      )
    );
  });

  it('stops removing frames at the first frame that does not match the expected order', () => {
    const stack = [
      'Error: [Reanimated] Message',
      '    at reportReanimatedLog (main.jsbundle:1:1)',
      '    at error (main.jsbundle:2:1)',
      '    at caller (main.jsbundle:3:1)',
    ].join('\n');

    expect(removeLoggerFrames(stack)).toBe(
      [
        'Error: [Reanimated] Message',
        '    at error (main.jsbundle:2:1)',
        '    at caller (main.jsbundle:3:1)',
      ].join('\n')
    );
  });

  it('returns a stack without frames unchanged', () => {
    expect(removeLoggerFrames('Error: [Reanimated] Message')).toBe('Error: [Reanimated] Message');
  });

  it('returns undefined for an undefined stack', () => {
    expect(removeLoggerFrames(undefined)).toBeUndefined();
  });
});
