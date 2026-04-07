import { Client } from '@modelcontextprotocol/sdk/client';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ensureTrailingPeriod } from '../utils/syncUtils.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, 'data/expo-mcp-tools.json');

const EXPO_MCP_URL = 'https://mcp.expo.dev/mcp';

const GITHUB_RAW_BASE =
  'https://raw.githubusercontent.com/expo/expo-mcp/main/packages/expo-mcp/src/mcp';

/**
 * Source files in the expo-mcp repo that contain registerTool/registerPrompt calls.
 */
const TOOL_SOURCE_FILES = ['tools.ts', 'tools/automation.ts'];
const PROMPT_SOURCE_FILES = ['prompts.ts'];

/**
 * Requirements for local tools that need specific libraries.
 * Keyed by tool name.
 */
const LOCAL_REQUIREMENTS = {
  expo_router_sitemap: 'requires `expo-router` library',
};

/**
 * Example prompts for server tools (docs-only, not from MCP server).
 * Keyed by tool name.
 */
const SERVER_EXAMPLE_PROMPTS = {
  learn: 'learn how to use expo-router',
  search_documentation: 'search documentation for CNG',
  read_documentation: 'read the Expo Router docs page',
  add_library: 'add sqlite and basic CRUD to the app',
  build_info: 'get the status of my latest iOS build',
  build_list: 'list the recent builds for this project',
  build_logs: 'show me the logs for the failed build',
  build_run: 'run a production build for iOS',
  build_cancel: 'cancel the build that is currently in progress',
  build_submit: 'submit the latest build to the App Store',
  testflight_crashes: 'show me recent TestFlight crashes',
  testflight_feedback: 'show TestFlight feedback for my app',
  workflow_create: 'create a CI/CD workflow for building and deploying',
  workflow_info: 'get the status of the latest workflow run',
  workflow_list: 'list the recent workflow runs',
  workflow_logs: 'show me the logs for the build job in the workflow',
  workflow_run: 'run the build-and-deploy workflow',
  workflow_cancel: 'cancel the running workflow',
  workflow_validate: 'validate my workflow file',
};

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

/**
 * Server tools that are internal/not user-facing and should be excluded from docs.
 */
const SERVER_TOOLS_EXCLUDE = new Set([
  'generate_agents_md',
  'generate_claude_md',
  'expo_mcp_diagnostics',
]);

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

/**
 * Fetches server tools from the Expo MCP server using the MCP client SDK.
 * Requires EXPO_TOKEN environment variable.
 */
async function fetchServerTools() {
  const token = process.env.EXPO_TOKEN;
  if (!token) {
    throw new Error(
      'EXPO_TOKEN environment variable is required to fetch server tools.\n' +
        'Create a personal access token at https://expo.dev/settings/access-tokens\n' +
        'and add it to docs/.env as EXPO_TOKEN=<your-token>'
    );
  }

  const client = new Client({ name: 'expo-docs-sync', version: '1.0.0' });

  const transport = new StreamableHTTPClientTransport(new URL(EXPO_MCP_URL), {
    requestInit: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });

  await client.connect(transport);

  const allTools = [];
  let toolCursor;
  do {
    const { tools, nextCursor } = await client.listTools({ cursor: toolCursor });
    allTools.push(...tools);
    toolCursor = nextCursor;
  } while (toolCursor);

  await client.close();

  return allTools
    .filter(tool => !SERVER_TOOLS_EXCLUDE.has(tool.name))
    .map(tool => ({
      name: tool.name,
      description: ensureTrailingPeriod(tool.description),
      examplePrompt: SERVER_EXAMPLE_PROMPTS[tool.name] ?? '',
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
    console.log('Fetching server tools from mcp.expo.dev...');
    const serverTools = await fetchServerTools();

    console.log('Fetching local tools from expo/expo-mcp repo...');
    const localToolResults = await Promise.all(
      TOOL_SOURCE_FILES.map(file => fetchAndParseRegistrations(file, 'registerTool'))
    );
    const localTools = localToolResults.flat().map(tool => ({
      ...tool,
      examplePrompt: LOCAL_EXAMPLE_PROMPTS[tool.name] ?? '',
      availability: 'Local',
      ...(LOCAL_REQUIREMENTS[tool.name] && { requirements: LOCAL_REQUIREMENTS[tool.name] }),
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
        server: EXPO_MCP_URL,
        localRepo: 'expo/expo-mcp',
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
