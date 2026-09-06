import { AGENT_PROMPTS, type AgentPromptPage } from './prompts';

const pages = Object.entries(AGENT_PROMPTS) as [string, AgentPromptPage][];

describe('AGENT_PROMPTS', () => {
  it.each(pages)('%s carries a title and description', (_id, page) => {
    expect(page.title.length).toBeGreaterThan(0);
    expect(page.description.length).toBeGreaterThan(0);
  });

  it.each(pages)('%s defines either one prompt or a set of options', (_id, page) => {
    expect(Boolean(page.prompt) !== Boolean(page.options)).toBe(true);
  });

  it.each(pages)('%s points every prompt at docs.expo.dev', (_id, page) => {
    const prompts = page.options?.map(option => option.prompt) ?? [page.prompt ?? ''];

    for (const prompt of prompts) {
      expect(prompt).toContain('https://docs.expo.dev/');
    }
  });

  it.each(pages)('%s names a selector label and default when it has options', (_id, page) => {
    if (!page.options) {
      return;
    }

    expect(page.selectorLabel).toBeTruthy();
    expect(page.options.map(option => option.id)).toContain(page.defaultOptionId);
  });

  it.each(pages)('%s keeps option ids unique', (_id, page) => {
    const ids = page.options?.map(option => option.id) ?? [];

    expect(new Set(ids).size).toBe(ids.length);
  });

  describe('development-builds', () => {
    const page = AGENT_PROMPTS['development-builds'];
    const byId = (id: string) => page.options.find(option => option.id === id)!.prompt;

    it('covers every build method the page offers', () => {
      expect(page.options.map(option => option.id)).toEqual([
        'build-locally',
        'build-with-eas',
        'eas-cli-local',
      ]);
    });

    it('always installs expo-dev-client', () => {
      for (const option of page.options) {
        expect(option.prompt).toContain('npx expo install expo-dev-client');
      }
    });

    it('compiles with Expo CLI when building locally', () => {
      expect(byId('build-locally')).toContain('npx expo run:android');
      expect(byId('build-locally')).toContain('npx expo run:ios');
      expect(byId('build-locally')).not.toContain('eas build');
    });

    it('runs a cloud build with EAS Build', () => {
      expect(byId('build-with-eas')).toContain('eas build --platform');
      expect(byId('build-with-eas')).toContain('--profile development');
      expect(byId('build-with-eas')).not.toContain('--local');
    });

    it('runs the EAS build on the local machine when asked for', () => {
      expect(byId('eas-cli-local')).toContain('eas build --platform');
      expect(byId('eas-cli-local')).toContain('--local');
    });

    it('carries the build method on the linked page for the non-default methods', () => {
      expect(byId('build-with-eas')).toContain('?buildenv=build-with-eas');
      expect(byId('eas-cli-local')).toContain('?buildenv=eas-cli-local');
      expect(byId('build-locally')).not.toContain('?buildenv=');
    });
  });
});
