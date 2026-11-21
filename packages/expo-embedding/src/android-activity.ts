import { join, relative } from 'node:path';

import {
  files,
  code,
  attribute,
  parseXml,
  readAndroidHostManifest,
  type HostFileChange,
} from './android-host';
import { readText as read } from './files';
export type { HostFileChange } from './android-host';
export type ActivityMigrationPlan = {
  root: string;
  activityName: string;
  changes: HostFileChange[];
};
const componentActivity = 'androidx.activity.ComponentActivity';
const appCompatActivity = 'androidx.appcompat.app.AppCompatActivity';
function manual(reason: string): never {
  throw new Error(
    `Cannot automatically configure the Android Activity: ${reason}. ` +
      'Follow templates/android/INTEGRATION.md in expo-embedding to configure the Activity manually, then rerun init.'
  );
}
type ActivitySource = {
  path: string;
  source: string;
  masked: string;
  name: string;
  superclass: string;
  superclassStart: number;
};
async function activitySources(root: string): Promise<ActivitySource[]> {
  const sources = (await files(join(root, 'app/src/main'))).filter((path) =>
    /\.(kt|java)$/.test(path)
  );
  const activities: ActivitySource[] = [];
  for (const path of sources) {
    const source = await read(path);
    const masked = code(source);
    const packageName = masked.match(/\bpackage\s+([\w.]+)/)?.[1];
    if (!packageName) continue;
    for (const match of masked.matchAll(/\bclass\s+(\w+)\s*(?::|extends)\s*([\w.]+)/g)) {
      activities.push({
        path,
        source,
        masked,
        name: `${packageName}.${match[1]}`,
        superclass: match[2],
        superclassStart: match.index + match[0].length - match[2].length,
      });
    }
  }
  return activities;
}
function superclassName(activity: ActivitySource): string {
  if (activity.superclass.includes('.')) return activity.superclass;
  const imports = [...activity.masked.matchAll(/\bimport\s+([\w.]+)(?:\s+as\s+(\w+))?/g)];
  const imported = imports.filter(
    (match) => (match[2] ?? match[1].split('.').at(-1)) === activity.superclass
  );
  if (imported.length > 1) manual(`ambiguous imports for ${activity.superclass}`);
  return (
    imported[0]?.[1] ??
    `${activity.name.slice(0, activity.name.lastIndexOf('.'))}.${activity.superclass}`
  );
}
async function themeChanges(
  root: string,
  theme: string | undefined,
  activity: ActivitySource
): Promise<HostFileChange[]> {
  if (/\bsetTheme\s*\(/.test(activity.masked))
    manual(`${activity.name} calls setTheme dynamically`);
  if (!theme?.match(/^@style\/[\w.]+$/))
    manual(`the launch Activity theme ${theme ?? '(missing)'} is not a local style`);
  const name = theme.slice('@style/'.length);
  const changes: HostFileChange[] = [];
  const variants = new Set<string>();
  const parents: Record<string, string> = {
    'android:Theme.Material.Light.NoActionBar': 'Theme.AppCompat.Light.NoActionBar',
    'android:Theme.Material.NoActionBar': 'Theme.AppCompat.NoActionBar',
  };
  for (const path of (await files(join(root, 'app/src/main/res'))).filter((path) =>
    /\/values[^/]*\/[^/]+\.xml$/.test(path)
  )) {
    const before = await read(path);
    const document = parseXml(before);
    const styles = document.children.filter(
      (element) => element.name === 'style' && attribute(element, 'name') === name
    );
    for (const style of styles) {
      const variant = relative(join(root, 'app/src/main/res'), path).split('/')[0];
      if (variants.has(variant)) manual(`duplicate ${name} styles in ${variant}`);
      variants.add(variant);
      const parent = style.attributes.get('parent');
      if (!parent) manual(`theme ${name} has an implicit parent`);
      if (
        /^(?:Base\.)?Theme\.(?:AppCompat|MaterialComponents|Material3)(?:\.|$)/.test(parent.value)
      )
        continue;
      const replacement = parents[parent.value];
      if (!replacement) manual(`theme ${name} inherits unsupported parent ${parent.value}`);
      changes.push({
        path,
        before,
        after: before.slice(0, parent.start) + replacement + before.slice(parent.end),
      });
    }
  }
  if (!variants.has('values')) manual(`theme ${name} has no default values/ definition`);
  return changes;
}
export async function planActivityMigration(root: string): Promise<ActivityMigrationPlan> {
  const { application, namespace } = await readAndroidHostManifest(root);
  const activities = application.children.filter((element) =>
    ['activity', 'activity-alias'].includes(element.name)
  );
  const launchers = activities.filter((element) =>
    element.children.some(
      (filter) =>
        filter.name === 'intent-filter' &&
        filter.children.some(
          (child) =>
            child.name === 'action' &&
            attribute(child, 'android:name') === 'android.intent.action.MAIN'
        ) &&
        filter.children.some(
          (child) =>
            child.name === 'category' &&
            attribute(child, 'android:name') === 'android.intent.category.LAUNCHER'
        )
    )
  );
  if (launchers.length !== 1) manual('expected exactly one launcher Activity');
  const launcher = launchers[0];
  if (launcher.name === 'activity-alias') manual('the launcher is an activity-alias');
  const declaredName = attribute(launcher, 'android:name');
  if (!declaredName || !/^[\w.]+$/.test(declaredName))
    manual('the launcher Activity name is not a literal class name');
  const activityName =
    declaredName.includes('.') && !declaredName.startsWith('.')
      ? declaredName
      : namespace
        ? `${namespace}.${declaredName.replace(/^\./, '')}`
        : manual('the Android namespace is not a literal string');
  const sources = await activitySources(root);
  const find = (name: string) => {
    const matches = sources.filter((source) => source.name === name);
    if (matches.length !== 1) manual(`cannot resolve a unique source declaration for ${name}`);
    return matches[0];
  };
  const activity = find(activityName);
  const plan: ActivityMigrationPlan = { root, activityName, changes: [] };
  let parent = superclassName(activity);
  const visited = new Set([activityName]);
  while (parent !== componentActivity && parent !== appCompatActivity) {
    if (visited.has(parent)) manual(`cyclic superclass ${parent}`);
    visited.add(parent);
    parent = superclassName(find(parent));
  }
  if (parent === appCompatActivity) return plan;
  if (superclassName(activity) !== componentActivity)
    manual(`${activityName} uses a custom superclass; migrate that base class manually`);
  if (!activity.path.endsWith('.kt'))
    manual('automatic superclass migration currently supports Kotlin Activities only');
  if (activities.length !== 1) manual('multiple Activities may share the launch theme');
  const importMatch = [
    ...activity.masked.matchAll(/^import\s+androidx\.activity\.ComponentActivity\s*;?[ \t]*$/gm),
  ];
  let after = activity.source;
  if (
    activity.superclass === 'ComponentActivity' &&
    importMatch.length === 1 &&
    !/\bAppCompatActivity\b/.test(activity.masked)
  ) {
    // Retain ComponentActivity imports used elsewhere in the file by adding the new import.
    const nameUses = activity.masked.match(/\bComponentActivity\b/g)?.length ?? 0;
    after =
      after.slice(0, activity.superclassStart) +
      'AppCompatActivity' +
      after.slice(activity.superclassStart + activity.superclass.length);
    const statement = importMatch[0];
    if (nameUses === 2) {
      const start = statement.index + statement[0].indexOf(componentActivity);
      after =
        after.slice(0, start) + appCompatActivity + after.slice(start + componentActivity.length);
    } else {
      const newline = after.includes('\r\n') ? '\r\n' : '\n';
      after =
        after.slice(0, statement.index) +
        `import ${appCompatActivity}${newline}` +
        after.slice(statement.index);
    }
  } else {
    after =
      after.slice(0, activity.superclassStart) +
      appCompatActivity +
      after.slice(activity.superclassStart + activity.superclass.length);
  }
  plan.changes.push({ path: activity.path, before: activity.source, after });
  plan.changes.push(
    ...(await themeChanges(
      root,
      attribute(launcher, 'android:theme') ?? attribute(application, 'android:theme'),
      activity
    ))
  );
  return plan;
}
export function activityMigrationPreview(plan: ActivityMigrationPlan): string {
  return [
    `${plan.activityName} extends ComponentActivity. The current Expo embedding delegate requires AppCompatActivity.`,
    'Proposed host edits (AppCompat is already exposed by :expoEmbedding):',
    hostChangesPreview(plan.root, plan.changes),
  ].join('\n');
}
export function hostChangesPreview(root: string, changes: HostFileChange[]): string {
  const lines: string[] = [];
  for (const change of changes) {
    lines.push(
      `\n${relative(root, change.path)}${change.before === undefined ? ' (new file)' : ''}`
    );
    const before = change.before?.split('\n') ?? [];
    const after = change.after.split('\n');
    if (before.length === after.length) {
      before.forEach((line, index) => {
        if (line !== after[index])
          lines.push(`@@ line ${index + 1} @@`, `- ${line}`, `+ ${after[index]}`);
      });
      continue;
    }
    let start = 0;
    while (start < before.length && start < after.length && before[start] === after[start]) start++;
    let end = 0;
    while (
      end < before.length - start &&
      end < after.length - start &&
      before[before.length - 1 - end] === after[after.length - 1 - end]
    )
      end++;
    lines.push(...before.slice(start, before.length - end).map((line) => `- ${line}`));
    lines.push(...after.slice(start, after.length - end).map((line) => `+ ${line}`));
  }
  return lines.join('\n') + '\n';
}
export async function approveActivityMigration(
  plan: ActivityMigrationPlan,
  options: {
    migrate?: string;
    ci?: string;
    interactive: boolean;
    confirm: () => Promise<boolean>;
  }
): Promise<void> {
  if (options.migrate !== undefined && options.migrate !== 'appcompat')
    throw new Error('Unsupported Activity migration. Use --migrate-activity=appcompat.');
  if (!plan.changes.length || options.migrate === 'appcompat') return;
  if (
    (options.ci && options.ci !== '0' && options.ci.toLowerCase() !== 'false') ||
    !options.interactive
  )
    throw new Error(
      `${plan.activityName} needs AppCompatActivity for the current Expo integration. ` +
        'Run init --migrate-activity=appcompat to apply the previewed migration, or configure the Activity manually. CI disables prompts; it does not authorize host edits.'
    );
  if (!(await options.confirm()))
    throw new Error(
      'Activity migration declined. Host files were not changed. Configure the Activity manually and rerun init.'
    );
}
