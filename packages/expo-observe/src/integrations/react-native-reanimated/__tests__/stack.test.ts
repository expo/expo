import { removeFirstFrame } from '../stack';

const FUNCTION_NAME = '__expo_observe_reportReanimatedLog';

// Stacks captured in the integration's `onLog` callback in a Release build of observe-tester on
// the iOS simulator (Hermes, Reanimated 4.7.0). The bundle paths are shortened, and the callback
// frame was renamed by hand after the callback was renamed.
const REACT_NATIVE_RUNTIME_STACK = [
  'Error: [Reanimated] Sample error from the React Native runtime (observe-tester)',
  '    at __expo_observe_reportReanimatedLog (main.jsbundle:107425:33)',
  '    at handleLog (main.jsbundle:114624:21)',
  '    at error (main.jsbundle:114677:18)',
  '    at run (main.jsbundle:197759:19)',
  '    at runSample (main.jsbundle:197796:19)',
].join('\n');
const UI_RUNTIME_STACK = [
  'Error: [Reanimated] Sample error from the UI runtime (observe-tester)',
  '    at __expo_observe_reportReanimatedLog (main.jsbundle:107425:33)',
].join('\n');

describe('removeFirstFrame', () => {
  it('removes only the named frame and keeps the Reanimated logger frames', () => {
    expect(removeFirstFrame(REACT_NATIVE_RUNTIME_STACK, FUNCTION_NAME)).toBe(
      [
        'Error: [Reanimated] Sample error from the React Native runtime (observe-tester)',
        '    at handleLog (main.jsbundle:114624:21)',
        '    at error (main.jsbundle:114677:18)',
        '    at run (main.jsbundle:197759:19)',
        '    at runSample (main.jsbundle:197796:19)',
      ].join('\n')
    );
  });

  it('keeps only the message for a log delivered from the UI runtime', () => {
    expect(removeFirstFrame(UI_RUNTIME_STACK, FUNCTION_NAME)).toBe(
      'Error: [Reanimated] Sample error from the UI runtime (observe-tester)'
    );
  });

  it('keeps a multi-line message intact', () => {
    const stack = [
      'Error: [Reanimated] Line one',
      '',
      'Line two',
      `    at ${FUNCTION_NAME} (main.jsbundle:1:1)`,
      '    at caller (main.jsbundle:2:1)',
    ].join('\n');

    expect(removeFirstFrame(stack, FUNCTION_NAME)).toBe(
      ['Error: [Reanimated] Line one', '', 'Line two', '    at caller (main.jsbundle:2:1)'].join(
        '\n'
      )
    );
  });

  it.each(['reportReanimatedLog', `${FUNCTION_NAME}2`])(
    'keeps a first frame from a different function, `%s`',
    (name) => {
      const stack = ['Error: Message', `    at ${name} (main.jsbundle:1:1)`].join('\n');

      expect(removeFirstFrame(stack, FUNCTION_NAME)).toBe(stack);
    }
  );

  it('keeps the named frame when it is not the first frame', () => {
    const stack = [
      'Error: Message',
      '    at caller (main.jsbundle:1:1)',
      `    at ${FUNCTION_NAME} (main.jsbundle:2:1)`,
    ].join('\n');

    expect(removeFirstFrame(stack, FUNCTION_NAME)).toBe(stack);
  });

  it('matches a minified name that contains regular expression characters literally', () => {
    const stack = ['Error: Message', '    at a$b (main.jsbundle:1:1)'].join('\n');

    expect(removeFirstFrame(stack, 'a$b')).toBe('Error: Message');
    expect(removeFirstFrame(stack, 'a.b')).toBe(stack);
  });

  it('returns a stack without frames unchanged', () => {
    expect(removeFirstFrame('Error: Message', FUNCTION_NAME)).toBe('Error: Message');
  });

  it('returns undefined for an undefined stack', () => {
    expect(removeFirstFrame(undefined, FUNCTION_NAME)).toBeUndefined();
  });
});
