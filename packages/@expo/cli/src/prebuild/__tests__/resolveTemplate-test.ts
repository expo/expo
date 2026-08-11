import { createTemplateFileFilter } from '../resolveTemplate';

describe(createTemplateFileFilter, () => {
  describe('repository root templates', () => {
    const filter = createTemplateFileFilter([]);

    it(`extracts regular project files`, () => {
      expect(filter('repo-main/package.json')).toBe(true);
      expect(filter('repo-main/ios/Podfile')).toBe(true);
      expect(filter('repo-main/tvos/Podfile')).toBe(true);
    });

    it(`extracts the .xcode.env dotfile for every Apple platform directory`, () => {
      expect(filter('repo-main/ios/.xcode.env')).toBe(true);
      expect(filter('repo-main/tvos/.xcode.env')).toBe(true);
    });

    it(`ignores other dotfiles`, () => {
      expect(filter('repo-main/.git/config')).toBe(false);
      expect(filter('repo-main/ios/.xcode.env.local')).toBe(false);
    });

    it(`ignores xcworkspace folders in every Apple platform directory`, () => {
      expect(filter('repo-main/ios/App.xcworkspace/contents.xcworkspacedata')).toBe(false);
      expect(filter('repo-main/tvos/App.xcworkspace/contents.xcworkspacedata')).toBe(false);
    });
  });

  describe('subdirectory templates', () => {
    const filter = createTemplateFileFilter(['templates', 'my-template']);

    it(`extracts files inside the subdirectory only`, () => {
      expect(filter('repo-main/templates/my-template/package.json')).toBe(true);
      expect(filter('repo-main/package.json')).toBe(false);
    });

    it(`extracts the .xcode.env dotfile for every Apple platform directory`, () => {
      expect(filter('repo-main/templates/my-template/ios/.xcode.env')).toBe(true);
      expect(filter('repo-main/templates/my-template/tvos/.xcode.env')).toBe(true);
    });

    it(`ignores xcworkspace folders`, () => {
      expect(filter('repo-main/templates/my-template/tvos/App.xcworkspace/x')).toBe(false);
    });
  });
});
