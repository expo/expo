import chalk from 'chalk';
import semver from 'semver';

/**
 * Parses the output from `npx expo install --check --json` and formats dependency
 * version mismatches into a structured, color-coded report.
 *
 * @param stdout - Raw stdout from `npx expo install --check --json` command
 * @param issues - Array to append formatted issue messages to
 * @param projectMajorSdkVersion - The major version of the project's SDK
 */
export function parseInstallCheckOutput(
  stdout: string,
  issues: string[],
  projectMajorSdkVersion: number
): void {
  if (!stdout.trim()) return;

  try {
    // Extract JSON even if warnings precede it
    const jsonMatch = stdout.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : stdout;
    const output = JSON.parse(jsonString);

    if (!output.upToDate && Array.isArray(output.dependencies) && output.dependencies.length) {
      type Row = {
        name: string;
        expected: string;
        found: string;
        bucket: 'major' | 'minor' | 'patch' | 'unknown';
        isExpo: boolean;
      };

      const rows: Row[] = output.dependencies
        .map((dep: any) => {
          const name = String(dep.packageName ?? '');
          const expectedRaw = String(dep.expectedVersionOrRange ?? '');
          const foundRaw = String(dep.actualVersion ?? '');

          const exp = semver.coerce(expectedRaw);
          const act = semver.coerce(foundRaw);

          let bucket: Row['bucket'] = 'unknown';
          if (exp && act) {
            if (act.version === exp.version) {
              return null; // skip matches
            }
            if (act.major !== exp.major) bucket = 'major';
            else if (act.minor !== exp.minor) bucket = 'minor';
            else if (act.patch !== exp.patch) bucket = 'patch';
            else bucket = 'unknown'; // prerelease/canary diff etc.
          }

          return {
            name,
            expected: expectedRaw,
            found: foundRaw,
            bucket,
            isExpo: name.startsWith('expo-'),
          };
        })
        .filter(Boolean) as Row[];

      if (!rows.length) return;

      const major = rows.filter((r) => r.bucket === 'major');
      const minor = rows.filter((r) => r.bucket === 'minor');
      const patch = rows.filter((r) => r.bucket === 'patch');
      const unknown = rows.filter((r) => r.bucket === 'unknown');

      // Compute widths from RAW strings (no ANSI)
      const nameWidth = Math.max('package'.length, ...rows.map((r) => r.name.length)) + 2;
      const expWidth = Math.max('expected'.length, ...rows.map((r) => r.expected.length)) + 2;
      const foundWidth = Math.max('found'.length, ...rows.map((r) => r.found.length)) + 2;

      const pad = (s: string, n: number) => s.padEnd(n, ' ');

      const formatSection = (
        title: string,
        rws: Row[],
        color: (s: string) => string,
        icon: string
      ) => {
        if (!rws.length) return '';
        const sectionLines: string[] = [];

        sectionLines.push(chalk.bold(color(`${icon} ${title}`)));
        sectionLines.push(
          chalk(
            `${pad('package', nameWidth)}${pad('expected', expWidth)}${pad('found', foundWidth)}`
          )
        );
        sectionLines.push(
          ...rws.map(
            (r) =>
              `${pad(r.name, nameWidth)}${chalk.green(pad(r.expected, expWidth))}${chalk.red(
                pad(r.found, foundWidth)
              )}`
          )
        );
        sectionLines.push('');
        return sectionLines.join('\n');
      };

      const changelogLines = rows
        .filter((r) => r.isExpo)
        .map(
          (r) =>
            `- ${r.name} → https://github.com/expo/expo/blob/sdk-${projectMajorSdkVersion}/packages/${r.name}/CHANGELOG.md`
        );
      const sections = [
        formatSection('Major version mismatches', major, chalk.yellow, '❗'),
        formatSection('Minor version mismatches', minor, chalk.yellow, '⚠️'),
        formatSection('Patch version mismatches', patch, chalk.yellow, '🔧'),
        formatSection('Other/prerelease mismatches', unknown, chalk.magenta, '➿'),
      ].filter(Boolean);

      const body = sections
        .map((section, index) => {
          if (index === 0) {
            return '\n' + section;
          }
          return section;
        })
        .join('\n');

      const changelogs = changelogLines.length
        ? chalk.bold('Changelogs:\n') + chalk.dim.blue(changelogLines.join('\n'))
        : '';

      const footer = chalk.bold(
        `\n${rows.length} package${rows.length > 1 ? 's' : ''} out of date.`
      );

      issues.push([body, changelogs, footer].join('\n'));
    }
  } catch {
    // Fallback: show raw output if parsing failed
    issues.push(stdout.trim());
  }
}
