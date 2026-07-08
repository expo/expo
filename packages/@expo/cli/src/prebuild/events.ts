import { events } from '2g';

declare module '2g' {
  interface EventRegistry {
    'prebuild:done': {
      platforms: string[];
      clean: boolean;
      template?: string;
    };
    'prebuild:template:resolved': {
      source: 'local' | 'npm' | 'git';
      name: string;
      version?: string;
    };
    'prebuild:pods:installed': {
      ms: number;
      skipped: boolean;
    };
    'prebuild:dependencies:installed': {
      packageManager: string;
      ms: number;
      skipped: boolean;
    };
    'prebuild:gitignore_check': { allPlatformsHaveGitignore: boolean };
    'prebuild:rename_files': { count: number };
    'prebuild:rename_file': { path: string };
    'prebuild:local_template_packing': { path: string };
    'prebuild:local_template_packed': { path: string };
    'prebuild:local_template_fallback': { path: string };
    'prebuild:template_option_repository': { uri: string };
    'prebuild:template_option_file': { path: string };
    'prebuild:template_option_npm': { name: string };
    'prebuild:sdk_template_fallback': { name: string };
    'prebuild:repo_tarball_download': { url: string };
  }
}

export const event = events('prebuild');
export const debugEvent = events.debug('prebuild');
