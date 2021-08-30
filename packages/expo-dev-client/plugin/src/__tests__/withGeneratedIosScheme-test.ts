import { setGeneratedIosScheme } from '../withGeneratedIosScheme';

it(`adds a scheme generated from slug`, () => {
  const config = { slug: 'cello' };
  const infoPlist = {};
  expect(setGeneratedIosScheme(config, infoPlist)).toMatchInlineSnapshot(`
    Object {
      "CFBundleURLTypes": Array [
        Object {
          "CFBundleURLSchemes": Array [
            "exp+cello",
          ],
        },
      ],
    }
  `);
});
