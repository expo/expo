import { setGeneratedIosScheme } from '../withGeneratedIosScheme';

it(`adds a scheme, if not specified in the config`, () => {
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

it(`doesn't add anything, if scheme is defined in config`, () => {
  const config = { scheme: 'play', slug: 'cello' };
  const infoPlist = {};
  expect(setGeneratedIosScheme(config, infoPlist)).toEqual(infoPlist);
});
