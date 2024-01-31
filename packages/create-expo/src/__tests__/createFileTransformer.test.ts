import { createGlobFilter } from '../createFileTransform';

describe(createGlobFilter, () => {
  it('returns true for files within glob pattern', () => {
    expect(createGlobFilter('**/*.js')('index.js')).toBe(true);
    expect(createGlobFilter('specific-file.json')('specific-file.json')).toBe(true);
    expect(createGlobFilter('*/templates/package.json')('github-root/templates/package.json')).toBe(
      true
    );
  });

  it('returns false for files outside glob pattern', () => {
    expect(createGlobFilter('**/*.js')('somefile.kt')).toBe(false);
    expect(createGlobFilter('specific-file.json')('not-it.json')).toBe(false);
    expect(createGlobFilter('*/templates/package.json')('package.json')).toBe(false);

    // Dotfiles are ignored by default
    expect(createGlobFilter('**/*')('.npmignore')).toBe(false);
  });
});
