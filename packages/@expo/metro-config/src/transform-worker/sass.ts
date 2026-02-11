import resolveFrom from 'resolve-from';

let sassInstance: typeof import('sass') | null = null;

// TODO(@kitten): Add optional peer for `sass` instead
function getSassInstance(projectRoot: string) {
  if (!sassInstance) {
    const sassPath = resolveFrom.silent(projectRoot, 'sass');

    if (!sassPath) {
      throw new Error(
        `Cannot parse Sass files without the module 'sass' installed. Run 'yarn add sass' and try again.`
      );
    }

    sassInstance = require(sassPath) as typeof import('sass');
  }

  return sassInstance;
}

export function matchSass(filename: string): import('sass').Syntax | null {
  if (filename.endsWith('.sass')) {
    return 'indented';
  } else if (filename.endsWith('.scss')) {
    return 'scss';
  }
  return null;
}

export function compileSass(
  projectRoot: string,
  { src }: { filename: string; src: string },
  options?: Record<string, any>
) {
  const sass = getSassInstance(projectRoot);
  const result = sass.compileString(src, options);
  return {
    src: result.css,
    // NOTE(@kitten): Types won't match up, but we're aware of the format from SASS matching
    map: result.sourceMap as any,
  };
}
