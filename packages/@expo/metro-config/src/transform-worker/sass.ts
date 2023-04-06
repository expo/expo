import resolveFrom from 'resolve-from';

export function matchSass(filename: string): import('sass').Syntax | null {
  if (filename.endsWith('.sass')) {
    return 'indented';
  } else if (filename.endsWith('.scss')) {
    return 'scss';
  }
  return null;
}

let sassInstance: typeof import('sass') | null = null;

function getSassInstance(projectRoot: string, { filename }: { filename: string }) {
  if (!sassInstance) {
    const sassPath = resolveFrom.silent(projectRoot, 'sass');

    if (!sassPath) {
      throw new Error(
        `Cannot find module 'sass' from '${projectRoot}'. Make sure it's installed. Parsing: ${filename}`
      );
    }

    sassInstance = require(sassPath) as typeof import('sass');
  }

  return sassInstance;
}

export function compileSass(
  projectRoot: string,
  { filename, src }: { filename: string; src: string },
  options?: Partial<import('sass').StringOptions<'sync'>>
) {
  const sass = getSassInstance(projectRoot, { filename });
  const result = sass.compileString(src, options);
  return { src: result.css, map: result.sourceMap };
}
