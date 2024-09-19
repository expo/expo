import { serializeOptimizeAsync } from '../fork/__tests__/serializer-test-utils';

jest.mock('../exportHermes', () => {
  return {
    buildHermesBundleAsync: jest.fn(({ code, map }) => ({
      hbc: code,
      sourcemap: map,
    })),
  };
});

xit(`supports global CSS files`, async () => {
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
  const [, artifacts] = await serializeOptimizeAsync(
    {
      'index.js': `
          import './styles.css';
        `,
      'styles.css': `
        @import './other.css';
    .container {
    color: dodgerblue;
    }
        `,
      'other.css': `

    .second {
    color: red;
    }
        `,
    },
    {
      minify: true,
    }
  );
  expect(artifacts.length).toBe(2);

  expect(artifacts[1].source).toMatch('red');
  expect(artifacts[1].source).toMatch('#1e90ff');
});

it(`supports global CSS files with URL imports`, async () => {
  const [, artifacts] = await serializeOptimizeAsync(
    {
      'index.js': `
          import './styles.css';
        `,
      'styles.css': `
        @import url('https://example.com/other.css');
        .container {
          color: dodgerblue;
        }
        `,
    },
    {
      minify: true,
    }
  );
  expect(artifacts.length).toBe(2);

  expect(artifacts[1].source).toMatch('#1e90ff');
});
