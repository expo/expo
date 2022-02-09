import { createTemporaryProjectFile } from './dotExpo';

export const ProjectSettings = createTemporaryProjectFile<{
  urlRandomness: string | null;
}>('settings.json', {
  urlRandomness: null,
});
