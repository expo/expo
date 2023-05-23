import { transformPostCssModule } from './postcss';
import { compileSass, matchSass } from './sass';

export async function cssPreprocessors(projectRoot: string, filename: string, data: Buffer) {
  let code = data.toString('utf8');

  // Apply postcss transforms
  code = await transformPostCssModule(projectRoot, {
    src: code,
    filename,
  });

  // TODO: When native has CSS support, this will need to move higher up.
  const syntax = matchSass(filename);
  if (syntax) {
    code = compileSass(projectRoot, { filename, src: code }, { syntax }).src;
  }

  return code;
}
