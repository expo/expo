import { writeFile } from 'fs/promises';
import { join } from 'path';

import { getTypedRoutesDeclarationFile } from './generate';
import { inMemoryContext, MemoryContext } from '../testing-library/context-stubs';

const fixtures: Record<string, MemoryContext> = {
  basic: {
    '/apple': () => null,
    '/banana': () => null,
    '/colors/[color]': () => null,
    '/animals/[...animal]': () => null,
    '/mix/[fruit]/[color]/[...animals]': () => null,
    '/(group)/static': () => null,
    '/(group)/(a,b)/folder/index': () => null,
    '/(group)/(a,b)/folder/[slug]': () => null,
    '/(group)/(a,b)/folder/[...slug]': () => null,
    '/(c)/folder/[slug]': () => null,
  },
};

export default async function () {
  await Promise.all(
    Object.entries(fixtures).map(async ([key, value]) => {
      const template = getTypedRoutesDeclarationFile(inMemoryContext(value));

      return writeFile(join(__dirname, '/__tests__/fixtures/', key + '.d.ts'), template);
    })
  );

  console.log('done');
}
