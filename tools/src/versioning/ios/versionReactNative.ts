import spawnAsync from '@expo/spawn-async';
import path from 'path';

export async function runReactNativeCodegenAsync(
  reactNativeRoot: string,
  versionedReactNativeRoot: string
): Promise<void> {
  const codegenCommand = path.join(reactNativeRoot, 'scripts', 'generate-specs.sh');
  const jsSourceDir = path.join(reactNativeRoot, 'Libraries');
  const outputDir = path.join(
    versionedReactNativeRoot,
    'React',
    'FBReactNativeSpec',
    'FBReactNativeSpec'
  );
  await spawnAsync(codegenCommand, [], {
    cwd: reactNativeRoot,
    env: {
      ...process.env,
      SRCS_DIR: jsSourceDir,
      CODEGEN_MODULES_OUTPUT_DIR: outputDir,
      CODEGEN_MODULES_LIBRARY_NAME: 'FBReactNativeSpec',
    },
  });
}
