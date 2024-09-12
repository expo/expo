import { serializeOptimizeAsync } from '../fork/__tests__/serializer-test-utils';

jest.mock('../exportHermes', () => {
  return {
    buildHermesBundleAsync: jest.fn(({ code, map }) => ({
      hbc: code,
      sourcemap: map,
    })),
  };
});

it(`supports global CSS files`, async () => {
  const [, artifacts] = await serializeOptimizeAsync({
    'index.js': `
          import './styles.css';
        `,
    'styles.css': `.container {
    color: blue;
    }
        `,
  });

  expect(artifacts[1].source).toBe('.container {\n  color: #00f;\n}\n');
});

it(`supports global CSS files with imports`, async () => {
  const [, artifacts] = await serializeOptimizeAsync({
    'index.js': `
          import './styles.css';
        `,
    'styles.css': `
        @import './other.css';
    .container {
    color: blue;
    }
        `,
    'other.css': `

    .second {
    color: red;
    }
        `,
  });
  console.log(artifacts);

  //   expect(artifacts[2].source).toBe('.second {\n  color: #00f;\n}\n');
});
