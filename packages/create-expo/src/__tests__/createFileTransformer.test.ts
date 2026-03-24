import { createGlobFilter, modifyFileDuringPipe } from '../createFileTransform';

describe(modifyFileDuringPipe, () => {
  it(`renames _vscode to .vscode`, () => {
    expect(
      modifyFileDuringPipe({
        path: 'package/_vscode/',
        type: 'File',
      }).path
    ).toEqual('package/.vscode/');
  });
  it(`renames files within _vscode to .vscode`, () => {
    expect(
      modifyFileDuringPipe({
        path: 'package/_vscode/settings.json',
        type: 'File',
      }).path
    ).toEqual('package/.vscode/settings.json');
  });
  it(`does not rename extraneous _ segments`, () => {
    expect(
      modifyFileDuringPipe({
        path: '_package/_vscode/settings.json',
        type: 'File',
      }).path
    ).toEqual('_package/.vscode/settings.json');
  });
  it(`does not rename multiple instances of _vscode`, () => {
    expect(
      modifyFileDuringPipe({
        path: '_package/_vscode/foo/_vscode/settings.json',
        type: 'File',
      }).path
    ).toEqual('_package/.vscode/foo/_vscode/settings.json');
  });
  it(`renames _claude to .claude`, () => {
    expect(
      modifyFileDuringPipe({
        path: 'package/_claude/settings.json',
        type: 'File',
      }).path
    ).toEqual('package/.claude/settings.json');
  });
  it(`renames _windsurf to .windsurf`, () => {
    expect(
      modifyFileDuringPipe({
        path: 'package/_windsurf/rules/expo.md',
        type: 'File',
      }).path
    ).toEqual('package/.windsurf/rules/expo.md');
  });
  it(`renames _cursor to .cursor`, () => {
    expect(
      modifyFileDuringPipe({
        path: 'package/_cursor/rules/expo.mdc',
        type: 'File',
      }).path
    ).toEqual('package/.cursor/rules/expo.mdc');
  });
  it(`renames _github to .github`, () => {
    expect(
      modifyFileDuringPipe({
        path: 'package/_github/copilot-instructions.md',
        type: 'File',
      }).path
    ).toEqual('package/.github/copilot-instructions.md');
  });
});

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
