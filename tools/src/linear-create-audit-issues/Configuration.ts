import { listOpenIssuesAsync, listOpenPRsAsync } from '../GitHub';
import { NpmDownloadStats } from '../Npm';

/**
 * Most packages labels resemble the module name with dropped `expo-` prefix and CamelCased-conversion,
 * but there are several that do not follow this pattern.
 */
const EXOTIC_PACKAGE_TO_LABEL_MAP: Record<string, string | string[] | undefined> = {
  'expo-ads-admob': 'Admob',
  'expo-sensors': [
    'Accelerometer',
    'Barometer',
    'DeviceMotion',
    'Gyroscope',
    'Magnetometer',
    'Pedometer',
    'sensors',
  ],
  'expo-analytics-amplitude': 'Amplitude',
  'expo-av': ['AV', 'Audio', 'Video'],
  'expo-barcode-scanner': 'BarCodeScanner',
  'expo-blur': 'BlurView',
  'expo-ads-facebook': 'FacebookAds',
  'expo-gl': 'GLView',
  'expo-google-sign-in': ['GoogleSignIn', 'Google'],
  'expo-haptics': 'Haptic',
  'expo-intent-launcher': 'IntentLauncherAndroid',
  'expo-network': ['Network', 'NetInfo'],
  'expo-analytics-segment': 'Segment',
  'expo-sms': 'SMS',
  'expo-sqlite': 'SQLite',
};

function getGitHubLabels(moduleName: string) {
  const exoticLabels = EXOTIC_PACKAGE_TO_LABEL_MAP[moduleName];
  if (exoticLabels) {
    return Array.isArray(exoticLabels) ? exoticLabels : [exoticLabels];
  }
  return [moduleName.replace('expo', '').replaceAll(/-(\w)/g, (c) => c[1].toUpperCase())];
}

function todayDateToString() {
  return Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date());
}

const createGitHubBasedIssue = (type: 'PR' | 'issue') => async (moduleName: string) => {
  const fetchingFunctions = {
    issue: listOpenIssuesAsync,
    PR: listOpenPRsAsync,
  } as const;
  const githubIssues = await fetchingFunctions[type]();
  const githubLabels = getGitHubLabels(moduleName);
  const titleKeywords = [moduleName];
  const issues = githubIssues.filter((issue) => {
    const issueLabels = issue.labels
      .map((l) => (typeof l === 'string' ? l : l.name))
      .filter((l): l is string => l !== undefined);
    const issueTitle = issue.title;
    const result =
      issueLabels.some((l) => githubLabels.includes(l)) ||
      titleKeywords.some((k) => issueTitle.match(new RegExp(`(^|\\s)${k}(\\s|$)`, 'i')));
    return result;
  });

  if (issues.length === 0) {
    return null;
  }

  const githubLabelsLinks = githubLabels
    .map((l) => `[\`${l}\`](https://github.com/expo/expo/labels/${l})`)
    .join(', ');
  const optionalGithubSearchReference =
    type === 'issue'
      ? `_You can also navigate to the GitHub to see those with proper labels ${githubLabelsLinks}_\n`
      : '';

  const elementsList = issues
    .map((i) => `- [ ] [#${i.number}: ${i.title}](${i.html_url})`)
    .join('\n');

  return `
### Below is an aggregated list of open ${type}s.

_This issue was generated on ${todayDateToString()} and presents the state from that day_

${optionalGithubSearchReference}
${elementsList}
`;
};

function getMonthlyDownloads(stats: NpmDownloadStats): string {
  return `${Math.floor(stats.byTimePeriods['last-month'] / 1000)}k/month`;
}

function getDownloadStatsReport(packageName: string, stats: NpmDownloadStats): string {
  const formatAndPad = (value: number, length: number = 23) => {
    return value
      .toString()
      .replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',')
      .padStart(length, ' ');
  };

  const {
    'last-day': daily,
    'last-week': weekly,
    'last-month': monthly,
    'last-year': yearly,
  } = stats.byTimePeriods;

  return `
## Downloads

_Below stats were generated on ${todayDateToString()} and presents the state from that day_

## Per time period

\`\`\`
| Timespan   | Total downloads         | Daily downloads         |
|------------|-------------------------|-------------------------|
| last day   | ${formatAndPad(daily)} | ${formatAndPad(daily)} |
| last week  | ${formatAndPad(weekly)} | ${formatAndPad(Math.floor(weekly / 7))} |
| last month | ${formatAndPad(monthly)} | ${formatAndPad(Math.floor(monthly / 30))} |
| last year  | ${formatAndPad(yearly)} | ${formatAndPad(Math.floor(yearly / 365))} |
\`\`\`

## [Per version](https://www.npmjs.com/package/${packageName}?activeTab=versions)

_First 10 most popular versions presented_

\`\`\`
| Version    | Downloads (last 7 days) | Daily downloads         | Date published          |
|------------|-------------------------|-------------------------|-------------------------|
${Object.entries(stats.byVersions)
  .sort((a, b) => b[1].downloads - a[1].downloads)
  .slice(0, 10)
  .map(
    ([version, { downloads, releaseDate }]) =>
      `| ${version.padStart(10, ' ')} | ${formatAndPad(downloads)} | ${formatAndPad(
        Math.floor(downloads / 7)
      )} | ${Intl.DateTimeFormat('en-US', { dateStyle: 'long' })
        .format(new Date(releaseDate))
        .padStart(23, ' ')} |`
  )
  .join('\n')}
\`\`\`
`;
}

const LinearConfiguration: {
  teamName: string;
  projectName: string;
  labelName: string;
  umbrellaIssue: {
    title: string;
    description: string;
    labelNames: string[];
    childIssueTemplate: {
      title: (moduleName: string, downloadStats: NpmDownloadStats) => string;
      description: (moduleName: string, downloadStats: NpmDownloadStats) => string;
      labelNames: string[];
      childIssueTemplates: {
        title: (moduleName: string) => string;
        /* If this returns null then the issue should not be created nor updated */
        description: string | null | ((moduleName: string) => Promise<string | null>);
        labelNames: string[];
      }[];
    };
    deprecatedChildIssueTemplate: {
      title: (moduleName: string, downloadStats: NpmDownloadStats) => string;
      description: (moduleName: string, downloadStats: NpmDownloadStats) => string;
      labelNames: string[];
      childIssueTemplates: {
        title: (moduleName: string) => string;
        /* If this returns null then the issue should not be created nor updated */
        description: string | null | ((moduleName: string) => Promise<string | null>);
        labelNames: string[];
      }[];
    };
  };
} = {
  teamName: 'Engineering',
  projectName: 'Audit Modules',
  labelName: 'Module',
  umbrellaIssue: {
    title: 'Audit Expo Modules Umbrella Issue',
    description: `
We haven't given many Expo modules the attention that they deserve.
Most of the modules need some cleaning and improvements across many areas (docs, tests, API consistency, migrating native codebase, etc.).

Below is the list of modules we're actively taking care of. Each of this module needs to be audited separately and ideally in every area mentioned.

Beware that there are modules that are scheduled to be deprecated in favour of the official alternatives developed by the 3rd parties.
We need to provide safe migration path for these modules before we deprecate them.
`,
    labelNames: ['Module'],
    childIssueTemplate: {
      title: (moduleName, downloadStats) =>
        `Audit ${moduleName} (${getMonthlyDownloads(downloadStats)})`,
      description: (moduleName, downloadStats) => `
Go through the following sub-issues and ensure the module is taken care of in each aspect mentioned.
Additionally add any missing sub-issues (reported on Twitter, Discord, etc.).

${getDownloadStatsReport(moduleName, downloadStats)}
`,
      labelNames: ['Module'],
      childIssueTemplates: [
        {
          title: (moduleName) => `Audit ${moduleName} - JS/TS API`,
          description: `Look at the JS/TS API and ensure it's consistent and properly typed. Pay extra attention to our public API rules (like adding \`Async\` suffix to the method names)`,
          labelNames: ['Module', 'API'],
        },
        {
          title: (moduleName) => `Audit ${moduleName} - audit docs`,
          description: `Ensure the docs for this module are up to date, comprehensive and easy to understand. Additionally ensure native english speaker has reviewed any changes.`,
          labelNames: ['Module', 'Docs'],
        },
        {
          title: (moduleName) => `Audit ${moduleName} - Web`,
          description: `Ensure this module is properly implemented on the Web platform.`,
          labelNames: ['Module', 'Web'],
        },
        {
          title: (moduleName) => `Audit ${moduleName} - Android: rewrite to Kotlin`,
          description: `Convert this module Android code to Kotlin.`,
          labelNames: ['Module', 'Android'],
        },
        {
          title: (moduleName) => `Audit ${moduleName} - Android: rewrite to Sweet API`,
          description: `Convert this module Android code to be SweetAPI-based`,
          labelNames: ['Module', 'Android'],
        },
        {
          title: (moduleName) => `Audit ${moduleName} - iOS: rewrite to Sweet API`,
          description: `Convert this module iOS code to be Sweet API-based`,
          labelNames: ['Module', 'iOS'],
        },
        {
          title: (moduleName) => `Audit ${moduleName} - JS tests`,
          description: `Audit JS tests for this module. Check \`test-suite\` app and provide solid test coverage.`,
          labelNames: ['Module', 'Testing'],
        },
        {
          title: (moduleName) => `Audit ${moduleName} - Android tests`,
          description: `Audit and most probably add missing Android tests for this module.`,
          labelNames: ['Module', 'Android', 'Testing'],
        },
        {
          title: (moduleName) => `Audit ${moduleName} - iOS tests`,
          description: `Audit and most probably add missing iOS tests for this module.`,
          labelNames: ['Module', 'iOS', 'Testing'],
        },
        {
          title: (moduleName) => `Audit ${moduleName} - examples screen`,
          description: `Audit example screen by checking whether all module's functionalities are presented.`,
          labelNames: ['Module', 'QA', `Testing`],
        },
        {
          title: (moduleName: string) =>
            `Audit ${moduleName} - compare with similar libraries and explore new platforms' capabilities`,
          description: `
Compare this module with other libraries available in the RN ecosystem.
Check the differences and possibly narrow the functionalities gap.
Additionally, explore the possible new capabilities offered by each platform.
`,
          labelNames: ['Module'],
        },
        {
          title: (moduleName) => `Audit ${moduleName} - bug bash GitHub issues`,
          description: createGitHubBasedIssue('issue'),
          labelNames: ['Module', 'Issue'],
        },
        {
          title: (moduleName) => `Audit ${moduleName} - address open PRs`,
          description: createGitHubBasedIssue('PR'),
          labelNames: ['Module', 'PR'],
        },
      ],
    },
    deprecatedChildIssueTemplate: {
      title: (moduleName, downloadStats) =>
        `Deprecate ${moduleName} (${getMonthlyDownloads(downloadStats)})`,
      description: (moduleName, downloadStats) => `
This module is scheduled to be deprecated.
Go through the following sub-issues and ensure each of them if taken care of.
Additionally add any missing sub-issues.

${getDownloadStatsReport(moduleName, downloadStats)}
`,
      labelNames: ['Module', 'Deprecation'],
      childIssueTemplates: [
        {
          title: (moduleName) => `Deprecate ${moduleName} - create config plugin`,
          description: `Write config plugin for the official 3rd party module and make it be merged and hopefully released.`,
          labelNames: ['Module', 'Deprecation'],
        },
        {
          title: (moduleName) => `Deprecate ${moduleName} - propagate native enchantments`,
          description: `We have Android Lifecycle Listeners and iOS AppDelegate Subscribers. We might be able to propagate them into official 3rd party module.`,
          labelNames: ['Module', 'Deprecation'],
        },
        {
          title: (moduleName) => `Deprecate ${moduleName} - remove from Expo`,
          description: `Once the official alternative is ready to be recommended by us remove this module from Expo (to be discussed how we do it).`,
          labelNames: ['Module', 'Deprecation'],
        },
      ],
    },
  },
};

export default LinearConfiguration;
