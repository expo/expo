import { createTemporaryProjectFile } from './dotExpo';

const SETTINGS_FILE_NAME = 'settings.json';

export const ProjectSettings = createTemporaryProjectFile<{
  urlRandomness: string | null;
}>(SETTINGS_FILE_NAME, {
  urlRandomness: null,
});
