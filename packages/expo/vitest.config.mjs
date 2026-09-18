import { defineUniversalConfig } from '@expo/vitest';

export default defineUniversalConfig({
  root: import.meta.dirname,
  // The SwiftPM autolinking plugin is plain Node code with its own tests (see scripts/spm).
  subprojects: ['scripts/spm'],
});
