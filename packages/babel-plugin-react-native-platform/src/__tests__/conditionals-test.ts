import { testCompressed, transform } from './utils';

it(`converts switch-statement predicates for Terser`, () => {
  const code = transform(
    `
    switch (Platform.OS) {
      case 'web':
        console.log('web');
        break;
      default:
        console.log('default');
        break;
    }
  `,
    {
      platform: `web`,
    }
  );
  expect(code).toMatch('switch ("web")');
  testCompressed(code);
});

describe(`if statements`, () => {
  const DEFAULT_BLOCK = `
  if (Platform.OS === 'ios') {
    console.log('iOS')
  } else if (Platform.OS == "android") {
    console.log('Android')
  } else if ("web" === Platform.OS) {
    console.log('web')
  } else {
    console.log('and beyond')
  }
  `;

  for (const platform of ['iOS', 'Android', 'web', 'custom']) {
    it(`only saves ${platform} code`, () => {
      const code = transform(DEFAULT_BLOCK, {
        platform: platform.toLowerCase(),
      });

      expect(code).not.toMatch('Platform.OS');
      expect(code).toMatchSnapshot();
      testCompressed(code);
    });
  }
});
