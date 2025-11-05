import { serializeOptimizeAsync } from '../fork/__tests__/serializer-test-utils';

jest.mock('../exportHermes', () => {
  return {
    buildHermesBundleAsync: jest.fn(({ code, map }) => ({
      hbc: code,
      sourcemap: map,
    })),
  };
});

const originalWarn = console.warn;

beforeEach(() => {
  console.warn = jest.fn(originalWarn);
});

afterAll(() => {
  console.warn = originalWarn;
});

it(`supports global CSS files`, async () => {
  const [, artifacts] = await serializeOptimizeAsync(
    {
      'index.js': `
          import './styles.css';
        `,
      'styles.css': `.container {
    color: blue;
    }
        `,
    },
    {
      platform: 'ios',
      css: true,
    }
  );

  expect(artifacts[0].source).toMatch('"color": "#00f"');
});

it(`supports CSS modules`, async () => {
  const [, artifacts] = await serializeOptimizeAsync(
    {
      'index.js': `
          import { container } from './styles.module.css';
        `,
      'styles.module.css': `.container {
    font-size: 2rem;
    }
        `,
    },
    {
      platform: 'ios',
      css: true,
    }
  );

  expect(artifacts[0].source).toMatch('"fontSize": 28');
});
