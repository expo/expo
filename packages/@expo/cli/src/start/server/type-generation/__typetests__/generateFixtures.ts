import { getTypedRoutesDeclarationFile } from 'expo-router/build/typed-routes/generate';
import { writeFile } from 'fs/promises';
import { join } from 'path';

function getMockContext(context: string[]) {
  return Object.assign(
    function (id: string) {
      return null;
    },
    {
      resolve: (key: string) => key,
      id: '0',
      keys: () => context,
    }
  );
}

const fixtures: Record<string, string[]> = {
  types: [
    '/apple',
    '/banana',
    '/colors/[color]',
    '/animals/[...animal]',
    '/mix/[fruit]/[color]/[...animals]',
    '/(group)/static',
    '/(group)/(a,b)/folder/index',
    '/(group)/(a,b)/folder/[slug]',
    '/(group)/(a,b)/folder/[...slug]',
  ],
};

export default async function () {
  await Promise.all(
    Object.entries(fixtures).map(async ([key, value]) => {
      const template = getTypedRoutesDeclarationFile(getMockContext(value));

      return writeFile(join(__dirname, './fixtures/', key + '.d.ts'), template);
    })
  );

  console.log('done');
}
