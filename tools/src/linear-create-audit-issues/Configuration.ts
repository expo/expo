import { listOpenIssuesAsync, listOpenPRsAsync } from '../GitHub';

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
  return [moduleName.replace('expo', '').replace(/-(\w)/, (c) => c.toUpperCase())];
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
${optionalGithubSearchReference}
${elementsList}
`;
};

const LinearConfiguration: {
  teamName: string;
  projectName: string;
  labelName: string;
  umbrellaIssue: {
    title: string;
    description: string;
    labelNames: string[];
    childIssueTemplate: {
      title: (moduleName: string) => string;
      description: string;
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
Beware that there are modules that might be deprecated or dropped completely in the near future.
`,
    labelNames: ['Module'],
    childIssueTemplate: {
      title: (moduleName: string) => `Audit ${moduleName}`,
      description: `
Go through the following sub-issues and ensure the module is taken care of in each aspect mentioned.
Additionally add any missing sub-issues (reported on Twitter, Discord, etc.).
If this module wraps some 3rd party API then, before working on it, ensure it won't to be deprecated in the nearest future in favour of the official alternative.
`,
      childIssueTemplates: [
        {
          title: (moduleName: string) => `Audit ${moduleName} - JS/TS API`,
          description: `Look at the JS/TS API and ensure it's consistent and properly typed. Pay extra attention to our public API rules (like adding \`Async\` suffix to the method names)`,
          labelNames: ['Module', 'API'],
        },
        {
          title: (moduleName: string) => `Audit ${moduleName} - audit docs`,
          description: `Ensure the docs for this module are up to date, comprehensive and easy to understand. Additionally ensure native english speaker has reviewed any changes.`,
          labelNames: ['Module', 'Docs'],
        },
        {
          title: (moduleName: string) => `Audit ${moduleName} - Web`,
          description: `Ensure this module is properly implemented on the Web platform.`,
          labelNames: ['Module', 'Web'],
        },
        {
          title: (moduleName: string) => `Audit ${moduleName} - Android: rewrite to Kotlin`,
          description: `Convert this module Android code to Kotlin.`,
          labelNames: ['Module', 'Android'],
        },
        {
          title: (moduleName: string) => `Audit ${moduleName} - Android: rewrite to Sweet API`,
          description: `Convert this module Android code to be SweetAPI-based`,
          labelNames: ['Module', 'Android'],
        },
        {
          title: (moduleName: string) => `Audit ${moduleName} - iOS: rewrite to Sweet API`,
          description: `Convert this module iOS code to be Sweet API-based`,
          labelNames: ['Module', 'iOS'],
        },
        {
          title: (moduleName: string) => `Audit ${moduleName} - JS tests`,
          description: `Audit JS tests for this module. Check \`test-suite\` app and provide solid test coverage.`,
          labelNames: ['Module', 'Testing'],
        },
        {
          title: (moduleName: string) => `Audit ${moduleName} - Android tests`,
          description: `Audit and most probably add missing Android tests for this module.`,
          labelNames: ['Module', 'Android', 'Testing'],
        },
        {
          title: (moduleName: string) => `Audit ${moduleName} - iOS tests`,
          description: `Audit and most probably add missing iOS tests for this module.`,
          labelNames: ['Module', 'iOS', 'Testing'],
        },
        {
          title: (moduleName: string) => `Audit ${moduleName} - examples screen`,
          description: `Audit example screen by checking all module's functionalities are presented.`,
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
          title: (moduleName: string) => `Audit ${moduleName} - bug bush GitHub issues`,
          description: createGitHubBasedIssue('issue'),
          labelNames: ['Module', 'Issue'],
        },
        {
          title: (moduleName: string) => `Audit ${moduleName} - address open PRs`,
          description: createGitHubBasedIssue('PR'),
          labelNames: ['Module', 'PR'],
        },
      ],
    },
  },
};

export default LinearConfiguration;
