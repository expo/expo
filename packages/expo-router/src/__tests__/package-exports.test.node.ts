import fs from 'node:fs';
import path from 'node:path';

type ConditionalExport = {
  types?: ConditionalExport | string;
  'expo-source'?: string;
  default?: string;
};

type RouterPackageJson = {
  files: string[];
  exports: Record<string, ConditionalExport | string>;
};

const packageRoot = path.resolve(__dirname, '../..');
const packageJson = JSON.parse(
  fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8')
) as RouterPackageJson;

function resolveRuntimeExport(exportKey: string, wildcard?: string): string {
  const entry = packageJson.exports[exportKey];
  expect(typeof entry).toBe('object');
  const conditional = entry as ConditionalExport;
  const target = conditional['expo-source'] ?? conditional.default;
  expect(target).toBeDefined();
  return wildcard ? target!.replace('*', wildcard) : target!;
}

describe('package exports', () => {
  it('publishes source files used by explicit expo-source exports', () => {
    expect(packageJson.files).toContain('src');
    expect(resolveRuntimeExport('.')).toBe('./src/index.tsx');
  });

  it('keeps wildcard build imports on compiled output under expo-source', () => {
    expect(resolveRuntimeExport('./build/*', 'link/Link')).toBe('./build/link/Link.js');
    expect(resolveRuntimeExport('./build/*.js', 'views/Navigator')).toBe(
      './build/views/Navigator.js'
    );
  });
});
