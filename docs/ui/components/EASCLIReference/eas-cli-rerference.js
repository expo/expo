import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, 'data/eas-cli-commands.json');
const CLI_REFERENCE_PAGE = path.resolve(__dirname, '../../..', 'pages/eas/cli.mdx');
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

function parseCommands(section) {
  const headingRegex = /^## `([^`]+)`/gm;
  const headings = Array.from(section.matchAll(headingRegex));
  const commands = [];
  const seen = new Set();

  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    const command = heading[1].trim();
    const start = heading.index + heading[0].length;
    const end = index + 1 < headings.length ? headings[index + 1].index : section.length;
    const body = section.slice(start, end).trim();

    if (seen.has(command)) {
      continue;
    }
    seen.add(command);

    commands.push({
      command,
      description: extractDescription(body),
      usage: extractUsage(body),
      seeCode: extractSeeCode(body),
    });
  }

  return { commands };
}

function writeOutput(data) {
  const outputDir = path.dirname(OUTPUT_FILE);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
}

function updateCliReferencePage(cliVersion) {
  const content = fs.readFileSync(CLI_REFERENCE_PAGE, 'utf8');
  const match = content.match(/^---\n([\S\s]*?)\n---\n/);
  const frontmatterLines = match[1].split('\n');
  const updatedLines = [];
  const hasCliVersion = frontmatterLines.some(line => line.startsWith('cliVersion:'));
  let inserted = false;

  for (const line of frontmatterLines) {
    if (line.startsWith('cliVersion:')) {
      updatedLines.push(`cliVersion: ${cliVersion}`);
      continue;
    }

    updatedLines.push(line);
    if (!hasCliVersion && !inserted && line.startsWith('description:')) {
      updatedLines.push(`cliVersion: ${cliVersion}`);
      inserted = true;
    }
  }

  if (!hasCliVersion && !inserted) {
    updatedLines.push(`cliVersion: ${cliVersion}`);
  }

  const updatedFrontmatter = updatedLines.join('\n');
  const updatedContent = `---\n${updatedFrontmatter}\n---\n${content.slice(match[0].length)}`;

  if (updatedContent !== content) {
    fs.writeFileSync(CLI_REFERENCE_PAGE, updatedContent);
    return true;
  }

  return false;
}

async function main() {
  const url = 'https://raw.githubusercontent.com/expo/eas-cli/main/packages/eas-cli/README.md';

  try {
    const readme = await fetchReadme(url);
    const cliVersion = extractCliVersion(readme);
    const section = extractCommandsSection(readme);
    const { commands } = parseCommands(section);

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
    if (updateCliReferencePage(cliVersion)) {
      console.log(`✅ Updated CLI version in ${path.relative(process.cwd(), CLI_REFERENCE_PAGE)}`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
