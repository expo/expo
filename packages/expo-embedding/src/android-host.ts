import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

import { exists, lstatIfExists, readText as read } from './files';
export type HostFileChange = {
  path: string;
  before: string | undefined;
  after: string;
};
function manual(reason: string): never {
  throw new Error(
    `Cannot inspect the Android host: ${reason}. Follow templates/android/INTEGRATION.md in expo-embedding to configure the host manually, then rerun init.`
  );
}
export async function files(directory: string): Promise<string[]> {
  if (!(await exists(directory))) return [];
  if ((await lstatIfExists(directory))?.isSymbolicLink())
    manual(`source path ${directory} is a symlink`);
  const paths: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) manual(`source path ${path} is a symlink`);
    paths.push(...(entry.isDirectory() ? await files(path) : [path]));
  }
  return paths;
}
// Keep offsets intact so edits do not touch comments, strings, or unrelated Kotlin code.
export function code(source: string): string {
  return source.replace(
    /\/\*[\s\S]*?\*\/|\/\/[^\n]*|"""[\s\S]*?"""|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,
    (value) => {
      if (value.startsWith('/*') && value.slice(2).includes('/*'))
        manual('nested source comments require manual inspection');
      return value.replace(/[^\r\n]/g, ' ');
    }
  );
}
type XmlAttribute = {
  value: string;
  start: number;
  end: number;
};
type XmlElement = {
  name: string;
  start: number;
  attributes: Map<string, XmlAttribute>;
  children: XmlElement[];
};
// This reader handles literal manifest/style declarations only. It never evaluates entities.
export function parseXml(source: string): XmlElement {
  const root: XmlElement = { name: '', start: 0, attributes: new Map(), children: [] };
  const stack = [root];
  const tokens = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<\/?[\w:.-]+(?:"[^"]*"|'[^']*'|[^'"<>])*>/g;
  let end = 0;
  for (const match of source.matchAll(tokens)) {
    if (source.slice(end, match.index).includes('<')) manual('unsupported XML syntax');
    end = match.index + match[0].length;
    const token = match[0];
    if (token.startsWith('<!--') || token.startsWith('<?')) continue;
    const name = token.match(/^<\/?([\w:.-]+)/)![1];
    if (token.startsWith('</')) {
      if (stack.length === 1 || stack.pop()!.name !== name) manual('unbalanced XML elements');
      continue;
    }
    const attributes = new Map<string, XmlAttribute>();
    const attributesStart = name.length + 1;
    const attributeText = token.slice(attributesStart).replace(/\/?\s*>$/, '');
    const pattern = /([\w:.-]+)\s*=\s*("[^"]*"|'[^']*')/g;
    let consumed = 0;
    for (const attribute of attributeText.matchAll(pattern)) {
      if (attributeText.slice(consumed, attribute.index).trim() || attributes.has(attribute[1]))
        manual('ambiguous XML attributes');
      const start =
        match.index +
        attributesStart +
        attribute.index +
        attribute[0].length -
        attribute[2].length +
        1;
      attributes.set(attribute[1], {
        value: attribute[2].slice(1, -1),
        start,
        end: start + attribute[2].length - 2,
      });
      consumed = attribute.index + attribute[0].length;
    }
    if (attributeText.slice(consumed).trim()) manual('unsupported XML attributes');
    const element = { name, start: match.index, attributes, children: [] };
    stack[stack.length - 1].children.push(element);
    if (!/\/\s*>$/.test(token)) stack.push(element);
  }
  if (source.slice(end).includes('<') || stack.length !== 1 || root.children.length !== 1)
    manual('incomplete XML document');
  return root.children[0];
}
export function attribute(element: XmlElement, name: string): string | undefined {
  return element.attributes.get(name)?.value;
}
export async function readAndroidHostManifest(root: string) {
  const builds: string[] = [];
  for (const name of ['build.gradle.kts', 'build.gradle']) {
    const path = join(root, 'app', name);
    if (await exists(path)) builds.push(path);
  }
  if (builds.length !== 1) manual('expected one app/build.gradle or app/build.gradle.kts');
  const build = await read(builds[0]);
  if (/\b(?:productFlavors|sourceSets)\b/.test(code(build)))
    manual('custom Gradle source sets or product flavors need manual inspection');
  for (const entry of await readdir(join(root, 'app/src'))) {
    if (
      ['main', 'test', 'androidTest'].includes(entry) ||
      entry.startsWith('test') ||
      entry.startsWith('androidTest')
    )
      continue;
    if ((await files(join(root, 'app/src', entry))).some((path) => /\.(xml|kt|java)$/.test(path)))
      manual(`source set ${entry} may override the launch Activity or its theme`);
  }
  const manifestPath = join(root, 'app/src/main/AndroidManifest.xml');
  if (!(await exists(manifestPath))) manual('app/src/main/AndroidManifest.xml is missing');
  const document = parseXml(await read(manifestPath));
  const applications = document.children.filter((element) => element.name === 'application');
  if (applications.length !== 1) manual('expected one application in the manifest');
  const application = applications[0];
  const namespaceDeclarations = [...code(build).matchAll(/\bnamespace\b/g)];
  if (namespaceDeclarations.length > 1) manual('multiple Android namespace declarations');
  const namespace = namespaceDeclarations.length
    ? build
        .slice(namespaceDeclarations[0].index)
        .match(/^namespace\s*(?:=\s*)?["']([\w.]+)["']/)?.[1]
    : attribute(document, 'package');
  return { application, namespace, manifestPath };
}
