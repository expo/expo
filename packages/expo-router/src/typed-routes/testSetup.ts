import { writeFile } from 'fs/promises';
import { join } from 'path';

import { getTypedRoutesDeclarationFile, GetTypedRoutesDeclarationFileOptions } from './generate';
import { inMemoryContext, MemoryContext } from '../testing-library/context-stubs';

const fixtures: Record<
  string,
  { context: MemoryContext; options?: GetTypedRoutesDeclarationFileOptions }
> = {
  default: {
    context: {
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
  },
  partialGroups: {
    options: { partialTypedGroups: true },
    context: {
      '/(group)/static': () => null,
      '/(group)/(a,b)/folder/index': () => null,
      '/(group)/(a,b)/folder/[slug]': () => null,
      '/(group)/(a,b)/folder/[...slug]': () => null,
    },
  },
};

module.exports = function () {
  return Promise.all(
    Object.entries(fixtures).map(async ([key, value]) => {
      const template = getTypedRoutesDeclarationFile(inMemoryContext(value.context), {
        ...value.options,
        testIgnoreComments: true,
      });

      return writeFile(join(__dirname, '/__tests__/fixtures/', key + '.d.ts'), template);
    })
  );
};
