import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, 'data/expo-mcp-tools.json');
const SERVER_TOOLS_FILE = path.join(__dirname, 'data/expo-mcp-server-tools.json');

const GITHUB_RAW_BASE =
  'https://raw.githubusercontent.com/expo/expo-mcp/main/packages/expo-mcp/src/mcp';

/**
 * Source files in the expo-mcp repo that contain registerTool/registerPrompt calls.
 */
const TOOL_SOURCE_FILES = ['tools.ts', 'tools/automation.ts'];
const PROMPT_SOURCE_FILES = ['prompts.ts'];

/**
 * Example prompts for local tools (docs-only, not in source code).
 * Keyed by tool/prompt name.
 */
const LOCAL_EXAMPLE_PROMPTS = {
  expo_router_sitemap: 'check the expo-router-sitemap output',
  open_devtools: 'open devtools',
  collect_app_logs: 'collect app logs from the iOS simulator',
  automation_tap: 'tap the screen at x=12, y=22',
  automation_take_screenshot: 'take a screenshot and verify the blue circle view',
  automation_find_view: "dump properties for testID 'button-123'",
};

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

function ensureTrailingPeriod(text) {
  if (!text) {
    return '';
  }
  return text.endsWith('.') ? text : `${text}.`;
}

/**
 * Reads server tools from the manually maintained JSON file.
 */
function readServerTools() {
  const content = fs.readFileSync(SERVER_TOOLS_FILE, 'utf-8');
  const data = JSON.parse(content);
  return data.tools.map(tool => ({
    ...tool,
    availability: 'Server',
  }));
}

/**
 * Parses registerTool/registerPrompt calls from TypeScript source files.
 * Extracts name and description from the registration config object.
 *
 * Matches patterns like:
 *   server.registerTool(
 *     'tool_name',
 *     {
 *       title: 'Tool title',
 *       description: 'Tool description',
 */
function parseRegistrations(content, method) {
  const results = [];
  const regex = new RegExp(
    `server\\.${method}\\(\\s*'([^']+)',[\\s\\S]*?description:\\s*(?:'([^']*(?:\\\\'[^']*)*)'|"([^"]*)")`,
    'g'
  );

  let match;
  while ((match = regex.exec(content)) !== null) {
    const description = match[2] ?? match[3];
    results.push({
      name: match[1],
      description: ensureTrailingPeriod(description.replace(/\\'/g, "'")),
    });
  }
  return results;
}

/**
 * Fetches a source file from the expo-mcp GitHub repo and parses registrations.
 */
async function fetchAndParseRegistrations(file, method) {
  const url = `${GITHUB_RAW_BASE}/${file}`;
  console.log(`  Fetching ${file}...`);
  const content = await fetchText(url);
  return parseRegistrations(content, method);
}

function writeOutput(data) {
  const outputDir = path.dirname(OUTPUT_FILE);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2) + '\n');
}

async function main() {
  try {
    console.log('Reading server tools from expo-mcp-server-tools.json...');
    const serverTools = readServerTools();

    console.log('Fetching local tools from expo/expo-mcp repo...');
    const localToolResults = await Promise.all(
      TOOL_SOURCE_FILES.map(file => fetchAndParseRegistrations(file, 'registerTool'))
    );
    const localTools = localToolResults.flat().map(tool => ({
      ...tool,
      examplePrompt: LOCAL_EXAMPLE_PROMPTS[tool.name] || '',
      availability: 'Local',
    }));

    console.log('Fetching prompts from expo/expo-mcp repo...');
    const localPromptResults = await Promise.all(
      PROMPT_SOURCE_FILES.map(file => fetchAndParseRegistrations(file, 'registerPrompt'))
    );
    const localPrompts = localPromptResults.flat().map(prompt => ({
      ...prompt,
      availability: 'Local',
    }));

    const allTools = [...serverTools, ...localTools];

    writeOutput({
      source: {
        repo: 'expo/expo-mcp',
        url: GITHUB_RAW_BASE,
        fetchedAt: new Date().toISOString(),
      },
      totalTools: allTools.length,
      totalPrompts: localPrompts.length,
      tools: allTools,
      prompts: localPrompts,
    });

    console.log(
      `Saved ${serverTools.length} server tools + ${localTools.length} local tools + ${localPrompts.length} prompts to ${path.relative(process.cwd(), OUTPUT_FILE)}`
    );
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
