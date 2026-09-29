'use strict';

const REPOSITORY = 'expo/expo';
const SEE_DIRECTIVE = /^\s*See:\s*(.*?)\s*$/i;
const SAFE_URL = /^https:\/\/[^\s<>]+$/;
const SAFE_MARKDOWN_LINK = /^\[[^\]\r\n]+\]\(https:\/\/[^\s()<>]+\)$/;
const SAFE_GITHUB_REFERENCE = /^#\d+$/;

function parseSummary(summary) {
  const lines = String(summary || '').replace(/\r\n?/g, '\n').split('\n');
  const body = [];
  let reference;
  let inFence = false;

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      body.push(line.trimEnd());
      continue;
    }
    const match = !inFence && line.match(SEE_DIRECTIVE);
    if (!match) {
      body.push(line.trimEnd());
      continue;
    }
    if (!reference && match[1] && isSafeReference(match[1])) {
      reference = match[1];
    }
  }

  while (body[0] === '') body.shift();
  while (body.at(-1) === '') body.pop();
  if (!body.some((line) => line.trim())) {
    body.push('[Internal] Updated package.');
  }

  return { body, reference };
}

function isSafeReference(reference) {
  return (
    SAFE_URL.test(reference) ||
    SAFE_MARKDOWN_LINK.test(reference) ||
    SAFE_GITHUB_REFERENCE.test(reference)
  );
}

function addTerminalPunctuation(lines) {
  const result = [...lines];
  const paragraphEnd = result.findIndex((line) => line === '');
  const lastIndex = paragraphEnd === -1 ? result.length - 1 : paragraphEnd - 1;
  const line = result[lastIndex];
  if (line && !/[.!?;:]$/.test(line) && !/`$/.test(line)) {
    result[lastIndex] = `${line}.`;
  }
  return result;
}

function formatListItem(lines) {
  const punctuated = addTerminalPunctuation(lines);
  return `- ${punctuated[0]}${punctuated.slice(1).map((line) => `\n  ${line}`).join('')}`;
}

function getPullRequestReference(reference) {
  if (!reference) return;
  if (SAFE_GITHUB_REFERENCE.test(reference)) {
    return { repo: REPOSITORY, pull: Number(reference.slice(1)) };
  }
  const url = reference.match(/^\[[^\]]+\]\((https:\/\/[^)]+)\)$/)?.[1] || reference;
  const match = url.match(
    /^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/pull\/(\d+)\/?(?:[?#].*)?$/i
  );
  if (match) return { repo: match[1], pull: Number(match[2]) };
}

async function resolveMetadata(changeset, reference) {
  const pullRequest = getPullRequestReference(reference);
  if (pullRequest) {
    try {
      const { getPullRequestInfo } = await import('@changesets/get-github-info');
      const info = await getPullRequestInfo(pullRequest);
      return { author: info?.author?.markdownLink };
    } catch {
      // An explicit PR must never be credited to the changeset's own commit author.
      return {};
    }
  }
  if (!changeset.commit) return {};
  try {
    const { getCommitInfo } = await import('@changesets/get-github-info');
    const info = await getCommitInfo({ repo: REPOSITORY, commit: changeset.commit });
    const commitReference = `[${changeset.commit.slice(0, 7)}](https://github.com/${REPOSITORY}/commit/${changeset.commit})`;
    return {
      author: info?.author?.markdownLink,
      reference: info?.pull?.markdownLink || info?.commit?.markdownLink || commitReference,
    };
  } catch {
    return {
      reference: `[${changeset.commit.slice(0, 7)}](https://github.com/${REPOSITORY}/commit/${changeset.commit})`,
    };
  }
}

function appendAttribution(line, reference, author) {
  const details = [reference, author && `by ${author}`].filter(Boolean).join(' ');
  if (!details) return line;
  return line.includes('\n') ? `${line}\n  \n  (${details})` : `${line} (${details})`;
}

async function getReleaseLine(changeset) {
  const { body, reference: override } = parseSummary(changeset.summary);
  const metadata = await resolveMetadata(changeset, override);
  return appendAttribution(formatListItem(body), override || metadata.reference, metadata.author);
}

async function getDependencyReleaseLine(changesets, dependenciesUpdated) {
  if (!dependenciesUpdated.length) return '';

  const references = [];
  for (const changeset of changesets) {
    const { reference: override } = parseSummary(changeset.summary);
    const reference = override || (await resolveMetadata(changeset)).reference;
    if (reference && !references.includes(reference)) references.push(reference);
  }

  const heading = appendAttribution('- Updated dependencies.', references.join(', '));
  return [
    heading,
    ...dependenciesUpdated.map(({ name, newVersion }) => `  - ${name}@${newVersion}`),
  ].join('\n');
}

const changelogFunctions = { getReleaseLine, getDependencyReleaseLine };

module.exports = {
  ...changelogFunctions,
  default: changelogFunctions,
};
