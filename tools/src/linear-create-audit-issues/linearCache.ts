import { Team, Project, Issue, IssueLabel, Connection } from '@linear/sdk';

import Configuration from './Configuration';
import linearClient from './LinearClient';
import { withSpinner } from './helpers';

/**
 * Key for every entry is a title/name of the entity.
 * Any duplicates are simply overwritten.
 * It's a simplified approach, but would work for our use case.
 */
const CACHE: {
  teams: Record<string, Team>;
  projects: Record<string, Project>;
  issues: Record<string, Issue>;
  labels: Record<string, IssueLabel>;
} = {
  teams: {},
  projects: {},
  issues: {},
  labels: {},
};

const createFetchingFunction = <T extends { id: string }>({
  spinnerText,
  cacheKey,
  initialQuery,
  requiredEntities = [],
  keyExtractor,
}: {
  spinnerText: string;
  cacheKey: keyof typeof CACHE;
  initialQuery: () => Promise<Connection<T>>;
  requiredEntities?: string[];
  keyExtractor: (entity: T) => string;
}) =>
  withSpinner(spinnerText, async () => {
    const result: T[] = [];
    let connection = await initialQuery();

    result.push(...connection.nodes);

    while (connection.pageInfo.hasNextPage) {
      connection = await connection.fetchNext();
      result.push(...connection.nodes);
    }

    CACHE[cacheKey] = result.reduce((acc, element) => {
      acc[keyExtractor(element)] = element;
      return acc;
    }, {});
    const missingEntities: string[] = [];
    for (const requiredEntity of requiredEntities) {
      if (!CACHE[cacheKey][requiredEntity]) {
        missingEntities.push(requiredEntity);
      }
    }
    if (missingEntities.length) {
      throw new Error(`${cacheKey}: ${missingEntities.map((el) => `'${el}'`).join(', ')}`);
    }
  });

const fetchTeams = createFetchingFunction({
  spinnerText: `Fetching teams`,
  cacheKey: 'teams',
  keyExtractor: (team) => team.name,
  initialQuery: () => linearClient.teams({ filter: { name: { eq: Configuration.teamName } } }),
  requiredEntities: [Configuration.teamName],
});

const fetchProjects = createFetchingFunction({
  spinnerText: `Fetching projects`,
  cacheKey: 'projects',
  keyExtractor: (project) => project.name,
  initialQuery: () =>
    linearClient.projects({
      filter: { name: { eq: Configuration.projectName } },
    }),
  requiredEntities: [Configuration.projectName],
});

const fetchLabels = createFetchingFunction({
  spinnerText: 'Fetching labels',
  cacheKey: 'labels',
  keyExtractor: (label) => label.name,
  initialQuery: () => linearClient.issueLabels(),
  requiredEntities: [
    ...new Set([
      ...Configuration.umbrellaIssue.childIssueTemplate.childIssueTemplates.flatMap(
        (el) => el.labelNames
      ),
      ...Configuration.umbrellaIssue.deprecatedChildIssueTemplate.childIssueTemplates.flatMap(
        (el) => el.labelNames
      ),
    ]),
  ],
});

const fetchIssues = createFetchingFunction({
  spinnerText: `Fetching issues`,
  cacheKey: 'issues',
  keyExtractor: (issue) => {
    const matched = issue.title.match(/(?<title>.+)(?<downloads> \(.*)/);
    const key = matched?.groups?.title ?? issue.title;
    return key;
  },
  initialQuery: () =>
    linearClient.issues({
      filter: {
        labels: {
          name: {
            eq: Configuration.labelName,
          },
        },
      },
    }),
});

export async function fetchCurrentLinearData() {
  const results = await Promise.allSettled([
    fetchTeams(),
    fetchProjects(),
    fetchLabels(),
    fetchIssues(),
  ]);
  const errors: Error[] = [];
  for (const result of results) {
    if (result.status === 'rejected') {
      errors.push(result.reason);
    }
  }
  if (errors.length) {
    throw new Error(
      `Following entities are missing in Linear.app. Create them manually:\n- ${errors
        .map((e) => e.message)
        .join('\n- ')}`
    );
  }
}

export function getUmbrellaIssue() {
  const umbrellaIssue = CACHE.issues[Configuration.umbrellaIssue.title];
  if (!umbrellaIssue) {
    throw new Error(
      `Umbrella issue ${Configuration.umbrellaIssue.title} is not available in Linear.app. Create one manually.`
    );
  }
  return umbrellaIssue;
}

export function getIssue(title: string) {
  const matched = title.match(/(?<title>.+)(?<downloads> \(.*)/);
  const key = matched?.groups?.title ?? title;
  if (CACHE.issues[key]) {
    return CACHE.issues[key];
  }
  return undefined;
}

export function getTeam(teamName: string) {
  if (CACHE.teams[teamName]) {
    return CACHE.teams[teamName];
  }
  throw new Error(`Team '${teamName}' is not available in Linear.app. Create it manually.`);
}

export function getProject(projectName: string) {
  if (CACHE.projects[projectName]) {
    return CACHE.projects[projectName];
  }
  throw new Error(`Project '${projectName}' is not available in Linear.app. Create it manually.`);
}

export function getLabel(labelName: string) {
  if (CACHE.labels[labelName]) {
    return CACHE.labels[labelName];
  }
  throw new Error(`Label '${labelName}' is not available in Linear.app. Create it manually.`);
}
