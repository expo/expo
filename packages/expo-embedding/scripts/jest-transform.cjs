const { transformSync } = require('esbuild');

module.exports = {
  process(source, filename) {
    const result = transformSync(source, {
      loader: 'ts',
      format: 'cjs',
      sourcefile: filename,
      sourcemap: 'inline',
    });
    return { code: result.code };
  },
};
