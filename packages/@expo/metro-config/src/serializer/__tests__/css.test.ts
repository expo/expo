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

it(`supports global CSS files with local imports`, async () => {
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
  expect(artifacts.length).toBe(3);

  expect(artifacts[1].source).toMatch('red');
  expect(artifacts[2].source).toMatch('#1e90ff');
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
  expect(artifacts.length).toBe(3);

  expect(artifacts[1].source).toMatch(
    '<link rel="stylesheet" href="https://example.com/other.css">'
  );
  expect(artifacts[2].source).toMatch('#1e90ff');
});

it(`supports url for style attributes`, async () => {
  const [, artifacts] = await serializeOptimizeAsync(
    {
      'index.js': `
          import './styles.css';
        `,
      'styles.css': `        
        .container {
          background: url('https://example.com/image.png');
        }
        `,
    },
    {
      minify: true,
    }
  );
  expect(artifacts.length).toBe(2);
  expect(artifacts[1].source).toMatch(
    '.container{background:url("https://example.com/image.png")}'
  );
});

it(`supports url with abstract imports for style attributes`, async () => {
  const [, artifacts] = await serializeOptimizeAsync(
    {
      'index.js': `
          import './styles.css';
        `,
      'styles.css': `        
        .other {
          background: url("data:image/svg+xml;charset=utf8,...");
        }
        .container {
          background-image: url(/icon-mask.svg);
          stroke: url(#edge-gradient);
        }
        `,
    },
    {
      minify: true,
    }
  );
  expect(artifacts.length).toBe(2);
  expect(artifacts[1].source).toMatch(
    '.other{background:url("data:image/svg+xml;charset=utf8,...")}.container{stroke:url("#edge-gradient");background-image:url("/icon-mask.svg")}'
  );
});

it(`asserts that local imports in attributes are not yet supported`, async () => {
  await serializeOptimizeAsync(
    {
      'index.js': `
          import './styles.css';
        `,
      'styles.css': `        
        .container {
          background: url('./image.png');
        }
        `,
    },
    {
      minify: true,
    }
  );

  expect(console.warn).toHaveBeenCalledTimes(1);
});

describe('css modules', () => {
  // TODO: We may want to roll this functionality back in the future since it introduces unscoped CSS in CSS modules.
  it(`supports local imports for style attributes in CSS modules`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `
            import styles from './styles.module.css';
            console.log(styles);
          `,
        'styles.module.css': `
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
    expect(artifacts.length).toBe(3);

    expect(artifacts[1].source).toMatch('red');
    expect(artifacts[2].source).toMatch('#1e90ff');
  });

  it(`supports remote imports for style attributes in CSS modules`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `
            import styles from './styles.module.css';
            console.log(styles);
          `,
        'styles.module.css': `
          @import url('https://example.com/image.png');
      .container {
      color: dodgerblue;
      }
          `,
      },
      {
        minify: true,
      }
    );
    expect(artifacts.length).toBe(3);

    expect(artifacts[1].source).toMatch(
      '<link rel="stylesheet" href="https://example.com/image.png">'
    );
    expect(artifacts[2].source).toMatch('#1e90ff');
  });
});
