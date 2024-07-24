// Rough estimation of how minifying works by default in Expo / Metro.
// We'll need to update this if we ever change the default minifier.
import getDefaultConfig from 'metro-config/src/defaults';
import metroMinify from 'metro-minify-terser';

export async function minifyLikeMetroAsync({
  code,
  map,
}: {
  code?: string | null;
  map?: any;
}): Promise<{ code?: string; map?: any }> {
  if (code == null) throw new Error('code is required for minifying');
  // @ts-expect-error: untyped function
  const terserConfig = (await getDefaultConfig('/')).transformer.minifierConfig;
  return metroMinify({
    code,
    map,
    reserved: [],
    config: {
      ...terserConfig,
      // TODO: Enable module support
      //   compress: { module: true },
    },
  });
}
