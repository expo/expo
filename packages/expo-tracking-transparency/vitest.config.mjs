import { defineUniversalConfig } from '@expo/vitest';

export default defineUniversalConfig({ root: import.meta.dirname, subprojects: ['plugin'] });
