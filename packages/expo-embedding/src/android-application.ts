import { join } from 'node:path';

import { approveActivityMigration, type ActivityMigrationPlan } from './android-activity';
import {
  attribute,
  code,
  files,
  readAndroidHostManifest,
  type HostFileChange,
} from './android-host';
import { lstatIfExists, readText as read } from './files';
export type ApplicationConfigurationPlan = {
  applicationName: string;
  changes: HostFileChange[];
};
function manual(reason: string): never {
  throw new Error(
    `Cannot automatically configure the Android Application: ${reason}. ` +
      'Keep your Application superclass and add ExpoApplicationDelegate composition using templates/android/INTEGRATION.md in expo-embedding, then rerun init.'
  );
}
function closingBrace(masked: string, start: number): number {
  let depth = 0;
  for (let index = start; index < masked.length; index++) {
    if (masked[index] === '{') depth++;
    if (masked[index] === '}' && --depth === 0) return index;
  }
  return manual('unbalanced Kotlin braces');
}
function depthAt(masked: string, position: number): number {
  let depth = 0;
  for (const character of masked.slice(0, position)) {
    if (character === '{') depth++;
    if (character === '}') depth--;
  }
  return depth;
}
type Edit = {
  start: number;
  end: number;
  text: string;
};
function configureApplicationSource(source: string, name: string): string {
  const masked = code(source);
  const className = name.split('.').at(-1)!;
  const declarations = [...masked.matchAll(/\bclass\s+(\w+)/g)].filter(
    (match) => match[1] === className
  );
  if (declarations.length !== 1) manual(`cannot locate one class declaration for ${name}`);
  const declaration = declarations[0];
  if (depthAt(masked, declaration.index) !== 0) manual(`${name} is a nested class`);
  const nameEnd = declaration.index + declaration[0].length;
  const open = masked.indexOf('{', nameEnd);
  const close = open < 0 ? source.length : closingBrace(masked, open);
  const header = masked.slice(nameEnd, open < 0 ? source.length : open);
  const body = open < 0 ? '' : masked.slice(open + 1, close);
  const newline = source.includes('\r\n') ? '\r\n' : '\n';
  const indent = source.slice(open + 1, close).match(/\n([ \t]+)\S/)?.[1] ?? '  ';
  const alreadyComposed = /\bReactApplication\s+by\s+expo\b/.test(header);
  if (/\bReactApplication\b/.test(header) && !alreadyComposed)
    manual(`${name} already implements ReactApplication; merge the host integration manually`);
  if (alreadyComposed) {
    if (
      !/\bval\s+expo\s*:\s*ExpoApplicationDelegate\s*=\s*ExpoApplicationDelegate\s*\(/.test(
        header
      ) ||
      !/^import\s+expo\.embedding\.ExpoApplicationDelegate\s*$/m.test(masked) ||
      !/^import\s+com\.facebook\.react\.ReactApplication\s*$/m.test(masked)
    )
      manual(`${name} has a partial or custom ReactApplication delegation`);
  } else {
    if (header.trimStart().startsWith('(')) manual(`${name} has a custom constructor`);
    if (!/^\s*:\s*[\w.]+\s*\(\s*\)(?:\s*,\s*[\w.]+)*\s*$/.test(header))
      manual(`${name} has a complex superclass or interface declaration`);
    if (/\/[/*]/.test(source.slice(nameEnd, open < 0 ? source.length : open)))
      manual(`${name} has comments inside its superclass declaration`);
    if (/\bexpo\b/.test(body)) manual(`${name} already uses the member name expo`);
  }
  const edits: Edit[] = [];
  const missing: string[] = [];
  for (const method of ['onCreate', 'onConfigurationChanged'] as const) {
    const matches = [
      ...body.matchAll(new RegExp(`\\boverride\\s+fun\\s+${method}\\b`, 'g')),
    ].filter((match) => depthAt(body, match.index) === 0);
    const declarations = [...body.matchAll(new RegExp(`\\bfun\\s+${method}\\b`, 'g'))].filter(
      (match) => depthAt(body, match.index) === 0
    );
    if (declarations.length !== matches.length)
      manual(`${name}.${method} has unsupported modifiers`);
    if (matches.length > 1) manual(`${name} has multiple ${method} overrides`);
    if (!matches.length) {
      if (alreadyComposed) manual(`${name} is missing the ${method} forwarding override`);
      missing.push(
        method === 'onCreate'
          ? `${indent}override fun onCreate() {${newline}${indent}${indent}super.onCreate()${newline}${indent}${indent}expo.onCreate(this)${newline}${indent}}`
          : `${indent}override fun onConfigurationChanged(newConfig: android.content.res.Configuration) {${newline}${indent}${indent}super.onConfigurationChanged(newConfig)${newline}${indent}${indent}expo.onConfigurationChanged(newConfig)${newline}${indent}}`
      );
      continue;
    }
    const start = open + 1 + matches[0].index;
    const signature = masked
      .slice(start)
      .match(
        method === 'onCreate'
          ? /^override\s+fun\s+onCreate\s*\(\s*\)\s*(?::\s*Unit\s*)?\{/
          : /^override\s+fun\s+onConfigurationChanged\s*\(\s*(\w+)\s*:\s*(?:android\.content\.res\.)?Configuration\s*\)\s*(?::\s*Unit\s*)?\{/
      );
    if (!signature) manual(`${name}.${method} has an unsupported signature or expression body`);
    const methodOpen = start + signature[0].length - 1;
    const methodClose = closingBrace(masked, methodOpen);
    const methodBody = masked.slice(methodOpen + 1, methodClose);
    const argument = method === 'onCreate' ? '' : signature[1];
    const superCalls = [
      ...methodBody.matchAll(new RegExp(`\\bsuper\\.${method}\\s*\\(\\s*${argument}\\s*\\)`, 'g')),
    ];
    if (superCalls.length !== 1 || depthAt(methodBody, superCalls[0].index) !== 0)
      manual(`${name}.${method} needs exactly one direct super.${method} call`);
    const superCall = superCalls[0];
    // Conditional one-line calls have no brace depth; only accept a standalone call statement.
    const beforeSuper = methodBody.slice(0, superCall.index);
    if (
      /^\s*(?:\?\.|\.)/.test(methodBody.slice(superCall.index + superCall[0].length)) ||
      /\b(?:if|when|try|for|while|return|throw)\b/.test(beforeSuper) ||
      beforeSuper
        .slice(Math.max(beforeSuper.lastIndexOf('\n'), beforeSuper.lastIndexOf(';')) + 1)
        .trim()
    )
      manual(`${name}.${method} needs a standalone super.${method} statement`);
    const superEnd = methodOpen + 1 + superCall.index + superCall[0].length;
    const forwardArgument = method === 'onCreate' ? 'this' : argument;
    const forwards = [
      ...methodBody.matchAll(
        new RegExp(`\\bexpo\\.${method}\\s*\\(\\s*${forwardArgument}\\s*\\)`, 'g')
      ),
    ];
    if (alreadyComposed) {
      if (
        forwards.length !== 1 ||
        depthAt(methodBody, forwards[0].index) !== 0 ||
        forwards[0].index <= superCall.index
      )
        manual(`${name}.${method} must forward to expo after super`);
      continue;
    }
    const lineStart = source.lastIndexOf('\n', superEnd) + 1;
    const callIndent = source.slice(lineStart, superEnd).match(/^[ \t]*/)?.[0] || indent + indent;
    edits.push({
      start: superEnd,
      end: superEnd,
      text: `${newline}${callIndent}expo.${method}(${forwardArgument})`,
    });
  }
  if (alreadyComposed) return source;
  const imports = ['expo.embedding.ExpoApplicationDelegate', 'com.facebook.react.ReactApplication'];
  const additions = imports.filter((qualified) => {
    const short = qualified.split('.').at(-1)!;
    if (new RegExp(`^import\\s+${qualified.replaceAll('.', '\\.')}\\s*$`, 'm').test(masked))
      return false;
    if (new RegExp(`\\b${short}\\b`).test(masked)) manual(`${name} already uses the name ${short}`);
    return true;
  });
  const packageLine = source.match(/^package[ \t]+[\w.]+[ \t]*;?[^\r\n]*(?:\r?\n|$)/m);
  if (!packageLine) manual(`${name} has no supported package declaration`);
  const packageEnd = packageLine.index! + packageLine[0].length;
  edits.push({
    start: packageEnd,
    end: packageEnd,
    text: `${newline}${additions.map((name) => `import ${name}`).join(newline)}${newline}`,
  });
  const superclass = source.slice(nameEnd, open < 0 ? source.length : open).trimEnd();
  edits.push({
    start: nameEnd,
    end: open < 0 ? source.length : open,
    text:
      `(${newline}${indent}val expo: ExpoApplicationDelegate = ExpoApplicationDelegate()${newline})${superclass}, ReactApplication by expo ` +
      (open < 0 ? `{${newline}${missing.join(newline + newline)}${newline}}${newline}` : ''),
  });
  if (open >= 0 && missing.length)
    edits.push({
      start: close,
      end: close,
      text: `${newline}${missing.join(newline + newline)}${newline}`,
    });
  let result = source;
  for (const edit of edits.sort((a, b) => b.start - a.start))
    result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
  return result;
}
export async function planApplicationConfiguration(
  root: string,
  pendingChanges: readonly HostFileChange[] = []
): Promise<ApplicationConfigurationPlan> {
  const { application, namespace, manifestPath } = await readAndroidHostManifest(root);
  const declared = attribute(application, 'android:name');
  if (declared !== undefined && !/^(?:\.?[A-Za-z_]\w*)(?:\.[A-Za-z_]\w*)*$/.test(declared))
    manual('android:name must be a literal Application class name');
  const create = !declared || declared === 'android.app.Application';
  if ((create || declared.startsWith('.') || !declared.includes('.')) && !namespace)
    manual('a literal Android namespace is required');
  const applicationName = create
    ? `${namespace}.MainApplication`
    : declared.startsWith('.') || !declared.includes('.')
      ? `${namespace}.${declared.replace(/^\./, '')}`
      : declared;
  const sources = (await files(join(root, 'app/src/main'))).filter((path) =>
    /\.(kt|java)$/.test(path)
  );
  const className = applicationName.split('.').at(-1)!;
  const packageName = applicationName.slice(0, applicationName.lastIndexOf('.'));
  const matches: string[] = [];
  for (const path of sources) {
    const masked = code(await read(path));
    if (
      masked.match(/\bpackage\s+([\w.]+)/)?.[1] === packageName &&
      new RegExp(`\\b(?:class|object|typealias)\\s+${className}\\b`).test(masked)
    )
      matches.push(path);
  }
  const plan: ApplicationConfigurationPlan = { applicationName, changes: [] };
  if (create) {
    const path = join(root, 'app/src/main/java', ...packageName.split('.'), 'MainApplication.kt');
    if (matches.length || (await lstatIfExists(path)))
      manual(
        `${applicationName} already exists but is not registered; set its android:name in the manifest and rerun init`
      );
    const source = `package ${packageName}\n\nimport android.app.Application\n\nclass MainApplication : Application()\n`;
    plan.changes.push({
      path,
      before: undefined,
      after: configureApplicationSource(source, applicationName),
    });
    const before = await read(manifestPath);
    const name = application.attributes.get('android:name');
    const start = name?.start ?? application.start + '<application'.length;
    const end = name?.end ?? start;
    const replacement = name ? applicationName : ` android:name="${applicationName}"`;
    plan.changes.push({
      path: manifestPath,
      before,
      after: before.slice(0, start) + replacement + before.slice(end),
    });
    return plan;
  }
  if (matches.length !== 1 || !matches[0].endsWith('.kt'))
    manual(`cannot locate one Kotlin source class for ${applicationName}`);
  const path = matches[0];
  const before = await read(path);
  const source = pendingChanges.find((change) => change.path === path)?.after ?? before;
  const after = configureApplicationSource(source, applicationName);
  if (before !== after) plan.changes.push({ path, before, after });
  return plan;
}
export async function approveHostConfiguration(
  activity: ActivityMigrationPlan,
  application: ApplicationConfigurationPlan,
  options: {
    configureHost?: boolean;
    migrate?: string;
    ci?: string;
    interactive: boolean;
    confirm: () => Promise<boolean>;
  }
): Promise<void> {
  if (!application.changes.length || options.configureHost) {
    await approveActivityMigration(activity, {
      ...options,
      migrate: options.configureHost ? 'appcompat' : options.migrate,
    });
    return;
  }
  if (
    (options.ci && options.ci !== '0' && options.ci.toLowerCase() !== 'false') ||
    !options.interactive
  )
    throw new Error(
      `Expo needs Application initialization in ${application.applicationName}. Run init --configure-host to apply the previewed Application and Activity edits. ` +
        'CI disables prompts; --migrate-activity only authorizes Activity/theme changes.'
    );
  if (!(await options.confirm()))
    throw new Error(
      'Host configuration declined. Host files were not changed. Configure the Application manually and rerun init.'
    );
}
