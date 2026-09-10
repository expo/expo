// Minify the way Expo's Metro transform worker does, so tests see the same terser output that
// ends up in a production bundle.
import { getDefaultConfig } from '@expo/metro-config';
import { minifyCode } from '@expo/metro-config/build/transform-worker/metro-transform-worker';
import path from 'path';

// A project root that resolves `react-native`, which `getDefaultConfig` needs.
const projectRoot = path.join(__dirname, '../../../../apps/bare-expo');

export async function minifyLikeMetroAsync({
  code,
}: {
  code?: string | null;
  map?: any;
}): Promise<{ code?: string; map?: any }> {
  if (code == null) throw new Error('code is required for minifying');
  const { transformer } = getDefaultConfig(projectRoot);
  return minifyCode(transformer, '/index.js', code, code, []);
}
