import { inMemoryContext } from 'expo-router/internal/testing';

import { getTypedRoutesDeclarationFile } from '../generate';
import { formatDiagnostics, getTypeErrors, ts } from './tsHarness';

// 15 features with 10 screens each
const screens: Record<string, () => null> = {};
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
    screens[`./${route}.tsx`] = () => null;
  }
}

const routes = getTypedRoutesDeclarationFile(inMemoryContext(screens), {
  partialTypedGroups: true,
  testIgnoreComments: true,
});

const assertions = ts`
  import type { Href } from './routes';

  declare const a: Href;
  declare const b: Href;
  declare const c: boolean;
  export const h = c ? a : b;
`;

it('combines two Href values in an app with 150 screens', () => {
  const diagnostics = getTypeErrors({ 'routes.ts': routes, 'index.ts': assertions });
  expect(formatDiagnostics(diagnostics)).toBe('');
});
