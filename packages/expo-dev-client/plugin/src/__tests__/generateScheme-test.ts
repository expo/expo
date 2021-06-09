import generateScheme from '../generateScheme';

it(`generates a valid URI scheme from slug`, () => {
  expect(generateScheme({ slug: 'hello-world' })).toMatchInlineSnapshot(`"exp+hello-world"`);
  expect(generateScheme({ slug: 'my app 2000' })).toMatchInlineSnapshot(`"exp+myapp2000"`);
  expect(generateScheme({ slug: 'Yolo ¯\\_(ツ)_/¯' })).toMatchInlineSnapshot(`"exp+yolo"`);
});

it(`removes unallowed characters`, () => {
  // scheme      = ALPHA *( ALPHA /` DIGIT / "+" / "-" / "." )
  expect(generateScheme({ slug: 'miun äppi!1!!!!!@' })).toMatch(/^[A-Za-z][A-Za-z0-9+\-.]*/);
});

it(`doesn't start with a number or special character`, () => {
  // scheme      = ALPHA *( ALPHA /` DIGIT / "+" / "-" / "." )
  expect(generateScheme({ slug: '650-industries' })).toMatch(/^[A-Za-z][A-Za-z0-9+\-.]*/);
});

it(`bails out if there aren't any ASCII characters in the slug to work with`, () => {
  expect(() => generateScheme({ slug: '👋' })).toThrowErrorMatchingInlineSnapshot(
    `"Could not autogenerate a scheme. Please set the \\"scheme\\" property in app config."`
  );
});
