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

it(`prevents adding a duplicate scheme`, () => {
  let infoPlist = {};
  const config = { slug: 'cello' };

  for (let i = 0; i < 2; i++) {
    infoPlist = setGeneratedIosScheme(config, infoPlist);
    expect(infoPlist).toMatchInlineSnapshot(`
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
  }
});
