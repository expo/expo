import resolveFrom from 'resolve-from';

let sassInstance: typeof import('sass') | null = null;

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
  { filename, src }: { filename: string; src: string },
  // TODO: Expose to users somehow...
  options?: Partial<import('sass').StringOptions<'sync'>>
) {
  const sass = getSassInstance(projectRoot);
  const result = sass.compileString(src, options);
  return {
    src: result.css,
    // TODO: Should we use this? Leaning towards no since the CSS will be parsed again by the CSS loader.
    map: result.sourceMap,
  };
}
