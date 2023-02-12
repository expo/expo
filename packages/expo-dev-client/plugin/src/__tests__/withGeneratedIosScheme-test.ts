import { setGeneratedIosScheme } from '../withGeneratedIosScheme';

it(`adds a scheme generated from slug`, () => {
  const config = { slug: 'cello' };
  const infoPlist = {};
  expect(setGeneratedIosScheme(config, infoPlist)).toMatchInlineSnapshot(`
    {
      "CFBundleURLTypes": [
        {
          "CFBundleURLSchemes": [
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

  infoPlist = setGeneratedIosScheme(config, infoPlist);
  expect(infoPlist).toMatchInlineSnapshot(`
    {
      "CFBundleURLTypes": [
        {
          "CFBundleURLSchemes": [
            "exp+cello",
          ],
        },
      ],
    }
  `);

  // ensure idempotent
  const infoPlist2 = setGeneratedIosScheme(config, infoPlist);
  expect(infoPlist2).toEqual(infoPlist);
});
