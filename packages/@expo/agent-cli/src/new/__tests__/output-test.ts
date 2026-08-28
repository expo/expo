import { createExpoOutputFilter } from '../output';

/** Run a whole recorded output through one filter, the way the printer feeds it line by line. */
function filtered(output: string): string {
  const filter = createExpoOutputFilter();
  return output
    .split('\n')
    .map((line) => filter(line))
    .filter((line) => line != null)
    .join('\n');
}

describe(createExpoOutputFilter, () => {
  // What a whole spinner lands as when there is no cursor to move: every frame on one line.
  it('keeps only what a terminal would have shown of a spinner', () => {
    const line =
      '⠋ Locating project files.\r⠙ Locating project files.\r⠹ Locating project files.\r✔ Downloaded and extracted project files.';

    expect(filtered(line)).toBe('✔ Downloaded and extracted project files.');
  });

  it('drops an animation that never resolved', () => {
    expect(filtered('⠋ Installing dependencies.\r⠙ Installing dependencies.')).toBe('');
  });

  it('leaves an ordinary line alone', () => {
    const line = 'Creating an Expo project using the expo-template-default template.';

    expect(filtered(line)).toBe(line);
  });

  // The block below the marker is answered by this command's own `Suggested next:`, and two
  // differently worded sets of instructions for one project is worse than either alone.
  it('stops at the tool’s own next-steps block, keeping the line that announces it', () => {
    const output = [
      'Creating an Expo project using the expo-template-default template.',
      '✅ Your project is ready!',
      '',
      'To run your project, navigate to the directory and run one of the following npm commands.',
      '- cd humanapp',
      '- npm run android',
      '- npm run ios',
      '- npm run web',
      '⚠️  Before running your app, make sure you have modules installed:',
      '  cd humanapp/',
      '  npm install',
    ].join('\n');

    expect(filtered(output)).toBe(
      'Creating an Expo project using the expo-template-default template.\n✅ Your project is ready!'
    );
  });

  it('recognises the marker through the colors the tool wrote it in', () => {
    expect(filtered('[1m✅ Your project is ready![22m\nnpm run ios')).toBe(
      '[1m✅ Your project is ready![22m'
    );
  });

  it('is one filter per run: a second one starts printing again', () => {
    const first = createExpoOutputFilter();
    first('✅ Your project is ready!');
    expect(first('- npm run ios')).toBeNull();

    expect(createExpoOutputFilter()('- npm run ios')).toBe('- npm run ios');
  });
});
