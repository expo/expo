import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ensureTrailingPeriod } from '../utils/syncUtils.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, 'data/expo-skills.json');

const GITHUB_API_URL = 'https://api.github.com/repos/expo/skills/contents/plugins/expo/skills';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/expo/skills/main/plugins/expo/skills';
const GITHUB_BLOB_BASE = 'https://github.com/expo/skills/blob/main/plugins/expo/skills';

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/vnd.github.v3+json' },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\S\s]*?)\n---/);
  if (!match) {
    return {};
  }

  const frontmatter = {};
  for (const line of match[1].split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) {
      continue;
    }
    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    frontmatter[key] = value;
  }
  return frontmatter;
}

async function fetchSkillMetadata(skillName) {
  const url = `${GITHUB_RAW_BASE}/${skillName}/SKILL.md`;
  const content = await fetchText(url);
  const frontmatter = parseFrontmatter(content);

  return {
    name: skillName,
    description: ensureTrailingPeriod(frontmatter.description),
    githubUrl: `${GITHUB_BLOB_BASE}/${skillName}/SKILL.md`,
  };
}

function writeOutput(data) {
  const outputDir = path.dirname(OUTPUT_FILE);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2) + '\n');
}

async function main() {
  try {
    const entries = await fetchJson(GITHUB_API_URL);
    const skillDirs = entries
      .filter(entry => entry.type === 'dir')
      .map(entry => entry.name)
      .sort();

    const skills = await Promise.all(skillDirs.map(fetchSkillMetadata));

    writeOutput({
      source: {
        repo: 'expo/skills',
        url: GITHUB_API_URL,
        fetchedAt: new Date().toISOString(),
      },
      totalSkills: skills.length,
      skills,
    });

    console.log(`Saved ${skills.length} skills to ${path.relative(process.cwd(), OUTPUT_FILE)}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
