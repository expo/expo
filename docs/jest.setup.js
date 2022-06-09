import { matchers } from '@emotion/jest';

// Add the custom matchers provided by '@emotion/jest'.
// To make TypeScript happy, import the types in types/global.d.ts
expect.extend(matchers);
