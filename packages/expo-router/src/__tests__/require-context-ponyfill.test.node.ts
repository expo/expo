import path from 'path';

import requireContext from '../testing-library/require-context-ponyfill';

it('does not fail on non-existent directories', () => {
  expect(() => requireContext('./non-existent-directory')).not.toThrow();
  expect(requireContext('./non-existent-directory').keys()).toHaveLength(0);
});

it('can scan a directory', () => {
  expect(requireContext(__dirname).keys()).toContain('./require-context-ponyfill.test.node.ts');
});

it('can scan a sub-directory', () => {
  expect(requireContext(path.join(__dirname, '..')).keys()).toContain(
    './__tests__/require-context-ponyfill.test.node.ts'
  );
});

it('will match a directory', () => {
  const context = requireContext(__dirname, true, /\.ios\.ts$/);

  // Make sure there are files
  expect(context.keys().length).toBeGreaterThan(0);
  // But not this file
  expect(context.keys()).not.toContain('./require-context-ponyfill.test.node.ts');
});
