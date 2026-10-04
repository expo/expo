import fs from 'fs';
import Module from 'module';
import path from 'path';

/** Returns the path of React Native's SwiftPM setup script in the project, or `null` when the installed version does not ship it. */
export function resolveSetupAppleSpmScript(
  projectRoot: string,
  // A require rooted in the project, so neither the bundler nor create-expo's own
  // node_modules can stand in for the project's react-native.
  resolve: (moduleId: string) => string = (moduleId) =>
    Module.createRequire(path.join(projectRoot, 'package.json')).resolve(moduleId)
): string | null {
  let reactNativePackageJson: string;
  try {
    reactNativePackageJson = resolve('react-native/package.json');
  } catch {
    return null;
  }
  const script = path.join(path.dirname(reactNativePackageJson), 'scripts', 'setup-apple-spm.js');
  return fs.existsSync(script) ? script : null;
}
