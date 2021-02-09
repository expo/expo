import { testCompressed, transform } from './utils';

it(`removes __DEV__ and process.env.NODE_ENV`, () => {
  const transpiledCode = transform(`
  if (__DEV__) {
    console.log("DEV MODE")
  } else {
    console.log("PROD MODE")
  }
  if (process.env.NODE_ENV === 'development') {
    console.log("DEV MODE")
  } else {
    console.log("PROD MODE")
  }
  `, {
    platform: `ios`,
    mode: 'development',
  });
  expect(transpiledCode).toMatchSnapshot();
  const minifiedCode = testCompressed(transpiledCode)
  expect(minifiedCode).toMatch('DEV');
  expect(minifiedCode).not.toMatch('PROD');
});

// react-native-web redefines this value.
// Terser should remove it during the bundling.
it(`keeps __DEV__ redefinition`, () => {
  const transpiledCode = transform(
    `
  const __DEV__ = process.env.NODE_ENV !== 'production';
  `,
    {
      platform: `web`,
      mode: 'development',
    }
  );

  expect(transpiledCode).toMatch('__DEV__');
  expect(transpiledCode).not.toMatch('process.env.NODE_ENV');
  testCompressed(transpiledCode)
});

// react-native-web redefines this value.
// Terser should remove it during the bundling.
it(`should pass over process.env.NODE_ENV redefinition`, () => {
  const transpiledCode = transform(
    `
  process.env.NODE_ENV = 'production';
  `,
    {
      platform: `web`,
      mode: 'development',
    }
  );
  expect(transpiledCode).toMatch(`process.env.NODE_ENV = 'production'`);
  testCompressed(transpiledCode)
});
