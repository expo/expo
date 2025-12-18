#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, 'data/eas-cli-commands.json');
const COMMANDS_START = '<!-- commands -->';
const COMMANDS_END = '<!-- commandsstop -->';

async function fetchReadme(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch README: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

function extractCliVersion(readme) {
  const match = readme.match(/blob\/v(\d+\.\d+\.\d+)/);
  return match ? match[1] : null;
}

function extractCommandsSection(readme) {
  const start = readme.indexOf(COMMANDS_START);
  const end = readme.indexOf(COMMANDS_END);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Commands section markers not found in README.');
  }
  return readme.slice(start + COMMANDS_START.length, end);
}

function extractDescription(body) {
  const codeFenceIndex = body.indexOf('```');
  const beforeCode = codeFenceIndex === -1 ? body : body.slice(0, codeFenceIndex);
  const lines = beforeCode
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => !line.startsWith('_See code:'));
  return lines[0] ?? '';
}

function extractUsage(body) {
  const match = body.match(/```([\S\s]*?)```/);
  return match ? match[1].trim() : '';
}

function extractSeeCode(body) {
  const match = body.match(/_See code: \[[^\]]+]\(([^)]+)\)_/);
  return match ? match[1] : '';
}

function deriveGroup(command) {
  const parts = command.trim().split(/\s+/);
  const token = parts[1] ?? '';
  const group = token.split(':')[0];
  return group || 'root';
}

function parseCommands(section) {
  const headingRegex = /^## `([^`]+)`/gm;
  const headings = Array.from(section.matchAll(headingRegex));
  const commands = [];
  const seen = new Set();
  const duplicates = [];

  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    const command = heading[1].trim();
    const start = heading.index + heading[0].length;
    const end = index + 1 < headings.length ? headings[index + 1].index : section.length;
    const body = section.slice(start, end).trim();

    if (seen.has(command)) {
      duplicates.push(command);
      continue;
    }
    seen.add(command);

    commands.push({
      command,
      description: extractDescription(body),
      usage: extractUsage(body),
      group: deriveGroup(command),
      seeCode: extractSeeCode(body),
    });
  }

  return { commands, duplicates };
}

function writeOutput(data) {
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
}

async function main() {
  const url = 'https://raw.githubusercontent.com/expo/eas-cli/main/packages/eas-cli/README.md';

  try {
    const readme = await fetchReadme(url);
    const cliVersion = extractCliVersion(readme);
    const section = extractCommandsSection(readme);
    const { commands, duplicates } = parseCommands(section);

    writeOutput({
      source: {
        url,
        fetchedAt: new Date().toISOString(),
        cliVersion,
      },
      totalCommands: commands.length,
      commands,
    });

    console.log(
      `✅ Saved ${commands.length} commands to ${path.relative(process.cwd(), OUTPUT_FILE)}`
    );
    if (duplicates.length > 0) {
      console.warn(`⚠️ Skipped ${duplicates.length} duplicate commands: ${duplicates.join(', ')}`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
