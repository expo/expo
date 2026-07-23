import getDefaultScheme from '../getDefaultScheme';

it(`generates a valid URI scheme from slug`, () => {
  expect(getDefaultScheme({ slug: 'hello-world' })).toMatchInlineSnapshot(`"exp+hello-world"`);
  expect(getDefaultScheme({ slug: 'my app 2000' })).toMatchInlineSnapshot(`"exp+myapp2000"`);
  expect(getDefaultScheme({ slug: 'Yolo ¯\\_(ツ)_/¯' })).toMatchInlineSnapshot(`"exp+yolo"`);
});

it(`removes unallowed characters`, () => {
  // scheme      = ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )
  expect(getDefaultScheme({ slug: 'miun äppi!1!!!!!@' })).toMatch(/^[A-Za-z][A-Za-z0-9+\-.]*/);
});

it(`doesn't start with a number or special character`, () => {
  // scheme      = ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )
  expect(getDefaultScheme({ slug: '650-industries' })).toMatch(/^[A-Za-z][A-Za-z0-9+\-.]*/);
});

it(`bails out if there aren't any ASCII characters in the slug to work with`, () => {
  expect(() => getDefaultScheme({ slug: '👋' })).toThrowErrorMatchingInlineSnapshot(
    `"Unable to generate a scheme based on the "slug" (👋), because it does not contain any URL-friendly characters."`
  );
});
