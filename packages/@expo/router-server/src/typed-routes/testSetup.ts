import type { MemoryContext } from 'expo-router/internal/testing';
import { inMemoryContext } from 'expo-router/internal/testing';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { GetTypedRoutesDeclarationFileOptions } from './generate';
import { getTypedRoutesDeclarationFile } from './generate';

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
      '/(group)/index': () => null,
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
  largeApp: {
    options: { partialTypedGroups: true },
    context: getLargeAppContext(),
  },
};

// 15 features with 10 screens each
function getLargeAppContext(): MemoryContext {
  const context: MemoryContext = {};
  for (let i = 0; i < 15; i++) {
    const f = `feature${i}`;
    for (const route of [
      `(app)/(tabs)/${f}/index`,
      `(app)/(tabs)/${f}/[id]`,
      `(app)/(tabs)/${f}/[id]/edit`,
      `(app)/(tabs)/${f}/[id]/details/[subId]`,
      `(app)/(tabs)/${f}/settings`,
      `(app)/(tabs)/${f}/new`,
      `(app)/(home,search)/${f}/[slug]`,
      `(app)/${f}/[...rest]`,
      `(auth)/${f}-login`,
      `${f}/about`,
    ]) {
      context[`./${route}.tsx`] = () => null;
    }
  }
  return context;
}

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
