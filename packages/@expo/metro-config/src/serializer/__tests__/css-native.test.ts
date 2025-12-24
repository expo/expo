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

describe('native CSS - global styles', () => {
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

  it(`supports multiple global CSS files`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `
          import './first.css';
          import './second.css';
        `,
        'first.css': `.container { color: red; }`,
        'second.css': `.wrapper { background-color: blue; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('"color": "#f00"');
    expect(artifacts[0].source).toMatch('"backgroundColor": "#00f"');
  });

  it(`supports nested CSS selectors`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `
          .parent {
            color: red;
            & .child {
              color: blue;
            }
          }
        `,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('"color"');
  });
});

describe('native CSS - CSS modules', () => {
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

  it(`supports CSS module composition with composes`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `
          import styles from './styles.module.css';
          console.log(styles.extended);
        `,
        'styles.module.css': `
          .base {
            color: red;
            padding: 10px;
          }
          .extended {
            composes: base;
            background-color: blue;
          }
        `,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    // Should export composed class names
    expect(artifacts[0].source).toMatch('extended');
    expect(artifacts[0].source).toMatch('base');
  });

  it(`exports CSS module class names correctly`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `
          import styles from './styles.module.css';
          console.log(styles.container, styles.wrapper);
        `,
        'styles.module.css': `
          .container { color: red; }
          .wrapper { color: blue; }
        `,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    // Module exports should include both class names
    expect(artifacts[0].source).toMatch('container');
    expect(artifacts[0].source).toMatch('wrapper');
  });
});

describe('native CSS - unit conversions', () => {
  it(`converts rem units`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { font-size: 1rem; margin: 2rem; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    // 1rem = 14px (default), 2rem = 28px
    expect(artifacts[0].source).toMatch('"fontSize": 14');
    expect(artifacts[0].source).toMatch('28');
  });

  it(`handles pixel units`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { width: 100px; height: 50px; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('"width": 100');
    expect(artifacts[0].source).toMatch('"height": 50');
  });

  it(`handles percentage units`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { width: 50%; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('"width": "50%"');
  });
});

describe('native CSS - flexbox', () => {
  it(`supports flexbox properties`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `
          .container {
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
          }
        `,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('"flexDirection": "row"');
    expect(artifacts[0].source).toMatch('"justifyContent": "center"');
    expect(artifacts[0].source).toMatch('"alignItems": "center"');
  });

  it(`supports flex shorthand`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.item { flex: 1; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    // flex: 1 is expanded to flexGrow, flexShrink, flexBasis
    expect(artifacts[0].source).toMatch('"flexGrow": 1');
    expect(artifacts[0].source).toMatch('"flexShrink": 1');
  });

  it(`supports gap property`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { gap: 10px; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('"gap": 10');
  });
});

describe('native CSS - transforms', () => {
  it(`supports transform scale`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { transform: scale(1.5); }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('transform');
    expect(artifacts[0].source).toMatch('scale');
  });

  it(`supports transform rotate`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { transform: rotate(45deg); }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('transform');
    expect(artifacts[0].source).toMatch('rotate');
  });

  it(`supports transform translate`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { transform: translateX(10px) translateY(20px); }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('transform');
    expect(artifacts[0].source).toMatch('translate');
  });

  it(`supports multiple transforms`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { transform: scale(1.2) rotate(45deg) translateX(10px); }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('transform');
  });
});

describe('native CSS - colors', () => {
  it(`converts hex colors`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { color: #ff5500; background-color: #333; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('"color"');
    expect(artifacts[0].source).toMatch('"backgroundColor"');
  });

  it(`converts rgb colors`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { color: rgb(255, 0, 0); }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('"color"');
  });

  it(`converts rgba colors`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { background-color: rgba(0, 0, 0, 0.5); }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('"backgroundColor"');
  });

  it(`supports named colors`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { color: red; background-color: dodgerblue; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('"color"');
    expect(artifacts[0].source).toMatch('"backgroundColor"');
  });

  it(`supports transparent`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { background-color: transparent; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('"backgroundColor"');
    // transparent is compiled to #0000 (transparent hex)
    expect(artifacts[0].source).toMatch('#0000');
  });
});

describe('native CSS - borders', () => {
  it(`supports border shorthand`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { border: 1px solid red; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('border');
  });

  it(`supports border-radius`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { border-radius: 10px; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('"borderRadius": 10');
  });

  it(`supports individual border-radius corners`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container {
          border-top-left-radius: 5px;
          border-top-right-radius: 10px;
          border-bottom-left-radius: 15px;
          border-bottom-right-radius: 20px;
        }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('"borderTopLeftRadius": 5');
    expect(artifacts[0].source).toMatch('"borderTopRightRadius": 10');
    expect(artifacts[0].source).toMatch('"borderBottomLeftRadius": 15');
    expect(artifacts[0].source).toMatch('"borderBottomRightRadius": 20');
  });
});

describe('native CSS - spacing', () => {
  it(`supports padding shorthand`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { padding: 10px; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('padding');
  });

  it(`supports margin shorthand`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { margin: 10px 20px; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('margin');
  });

  it(`supports individual padding properties`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container {
          padding-top: 5px;
          padding-right: 10px;
          padding-bottom: 15px;
          padding-left: 20px;
        }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('"paddingTop": 5');
    expect(artifacts[0].source).toMatch('"paddingRight": 10');
    expect(artifacts[0].source).toMatch('"paddingBottom": 15');
    expect(artifacts[0].source).toMatch('"paddingLeft": 20');
  });
});

describe('native CSS - typography', () => {
  it(`supports font-weight`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { font-weight: bold; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('"fontWeight"');
  });

  it(`supports numeric font-weight`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { font-weight: 600; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('"fontWeight"');
    expect(artifacts[0].source).toMatch('600');
  });

  it(`supports text-align`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { text-align: center; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('"textAlign": "center"');
  });

  it(`supports line-height`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { line-height: 1.5; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('"lineHeight"');
  });

  it(`supports letter-spacing`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { letter-spacing: 2px; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('"letterSpacing"');
  });

  it(`supports text-transform`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { text-transform: uppercase; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('"textTransform": "uppercase"');
  });
});

describe('native CSS - shadows', () => {
  it(`supports box-shadow`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { box-shadow: 0 2px 4px rgba(0,0,0,0.2); }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    // Box shadow is compiled with boxShadow structure
    expect(artifacts[0].source).toMatch('boxShadow');
    expect(artifacts[0].source).toMatch('blurRadius');
  });

  it(`supports text-shadow`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { text-shadow: 1px 1px 2px black; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('Shadow');
  });
});

describe('native CSS - positioning', () => {
  it(`supports position absolute`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { position: absolute; top: 0; left: 0; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('"position": "absolute"');
    expect(artifacts[0].source).toMatch('"top": 0');
    expect(artifacts[0].source).toMatch('"left": 0');
  });

  it(`supports position relative`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { position: relative; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('"position": "relative"');
  });

  it(`supports z-index`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { z-index: 100; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('"zIndex": 100');
  });
});

describe('native CSS - dimensions', () => {
  it(`supports width and height`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { width: 200px; height: 100px; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('"width": 200');
    expect(artifacts[0].source).toMatch('"height": 100');
  });

  it(`supports min/max dimensions`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container {
          min-width: 100px;
          max-width: 500px;
          min-height: 50px;
          max-height: 300px;
        }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('"minWidth": 100');
    expect(artifacts[0].source).toMatch('"maxWidth": 500');
    expect(artifacts[0].source).toMatch('"minHeight": 50');
    expect(artifacts[0].source).toMatch('"maxHeight": 300');
  });

  it(`supports aspect-ratio`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { aspect-ratio: 16/9; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('aspectRatio');
  });
});

describe('native CSS - opacity and visibility', () => {
  it(`supports opacity`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { opacity: 0.5; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('"opacity": 0.5');
  });

  it(`supports overflow`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { overflow: hidden; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('"overflow": "hidden"');
  });
});

describe('native CSS - CSS variables', () => {
  it(`supports CSS custom properties`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `
          :root {
            --primary-color: blue;
          }
          .container {
            color: var(--primary-color);
          }
        `,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    // Should compile CSS variables
    expect(artifacts[0].source).toMatch('color');
  });

  it(`supports CSS variables in modules`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import styles from './styles.module.css';`,
        'styles.module.css': `
          :root {
            --spacing: 10px;
          }
          .container {
            padding: var(--spacing);
          }
        `,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('padding');
  });
});

describe('native CSS - platform selection', () => {
  it(`works on iOS platform`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { color: red; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('StyleCollection.inject');
  });

  it(`works on Android platform`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { color: red; }`,
      },
      {
        platform: 'android',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('StyleCollection.inject');
  });
});

describe('native CSS - fallback behavior', () => {
  it(`returns empty module when css option is not enabled`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { color: red; }`,
      },
      {
        platform: 'ios',
        css: false,
      }
    );

    // Should not contain StyleCollection.inject when CSS is disabled
    expect(artifacts[0].source).not.toMatch('StyleCollection.inject');
  });

  it(`returns empty exports for CSS modules when css option is not enabled`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `
          import styles from './styles.module.css';
          console.log(styles);
        `,
        'styles.module.css': `.container { color: red; }`,
      },
      {
        platform: 'ios',
        css: false,
      }
    );

    // Should have unstable_styles empty object
    expect(artifacts[0].source).toMatch('unstable_styles');
  });
});

describe('native CSS - complex selectors', () => {
  it(`supports multiple classes`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `
          .container { color: red; }
          .wrapper { background-color: blue; }
          .item { padding: 10px; }
        `,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('"color"');
    expect(artifacts[0].source).toMatch('"backgroundColor"');
    expect(artifacts[0].source).toMatch('padding');
  });

  it(`supports descendant selectors`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.parent .child { color: red; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('color');
  });
});

// NOTE: SCSS tests require sass to be resolvable from the test project root.
// These tests are skipped because the test infrastructure uses a virtual `/app`
// project root where sass cannot be resolved. The matchSass and compileSass
// functions are tested in transform-worker/__tests__/sass.test.ts instead.
describe.skip('native CSS - Sass/SCSS (requires sass resolution from project root)', () => {
  it(`supports SCSS files`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.scss';`,
        'styles.scss': `
          $primary-color: blue;
          .container {
            color: $primary-color;
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

  it(`supports SCSS variables`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.scss';`,
        'styles.scss': `
          $spacing: 10px;
          $radius: 5px;
          .container {
            padding: $spacing;
            border-radius: $radius;
          }
        `,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('padding');
    expect(artifacts[0].source).toMatch('"borderRadius": 5');
  });

  it(`supports SCSS nesting`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.scss';`,
        'styles.scss': `
          .parent {
            color: red;
            .child {
              color: blue;
            }
          }
        `,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('color');
  });

  it(`supports SCSS modules`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import styles from './styles.module.scss';`,
        'styles.module.scss': `
          $base-size: 16px;
          .container {
            font-size: $base-size;
            padding: $base-size / 2;
          }
        `,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('fontSize');
    expect(artifacts[0].source).toMatch('container');
  });

  it(`supports SCSS mixins`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.scss';`,
        'styles.scss': `
          @mixin flex-center {
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .container {
            @include flex-center;
          }
        `,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('"justifyContent": "center"');
    expect(artifacts[0].source).toMatch('"alignItems": "center"');
  });
});

describe('native CSS - edge cases', () => {
  it(`handles empty CSS file`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': ``,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    // Should still produce valid output
    expect(artifacts[0].source).toBeDefined();
  });

  it(`handles CSS with only comments`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `/* This is a comment */`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toBeDefined();
  });

  it(`handles zero values`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { margin: 0; padding: 0; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('0');
  });

  it(`handles negative values`, async () => {
    const [, artifacts] = await serializeOptimizeAsync(
      {
        'index.js': `import './styles.css';`,
        'styles.css': `.container { margin-top: -10px; }`,
      },
      {
        platform: 'ios',
        css: true,
      }
    );

    expect(artifacts[0].source).toMatch('-10');
  });
});
