const fs = require('fs/promises');
const path = require('path');

const LLM_CONFIGS_EXPO_APP_TEMPLATE_BASE_URL =
  'https://raw.githubusercontent.com/expo/llm-configs/main/expo-app';
const AGENT_TEMPLATE_FILE_NAMES = ['AGENTS.md', 'CLAUDE.md'];

async function fetchTemplateAsync(fileName) {
  const url = `${LLM_CONFIGS_EXPO_APP_TEMPLATE_BASE_URL}/${fileName}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return await response.text();
}

(async () => {
  const templatesDir = path.join(__dirname, '..', 'template', 'agent-files');
  await fs.mkdir(templatesDir, { recursive: true });

  await Promise.all(
    AGENT_TEMPLATE_FILE_NAMES.map(async (fileName) => {
      const content = await fetchTemplateAsync(fileName);
      await fs.writeFile(path.join(templatesDir, fileName), content);
    })
  );

  // eslint-disable-next-line no-console
  console.log('Synced new app agent templates from expo/llm-configs');
})();
