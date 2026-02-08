import fs from 'node:fs';
import path from 'node:path';

const OUTPUT_DIRECTORY_NAME = 'public';
const OUTPUT_FILENAME = 'llms-sdk.txt';
const TITLE = 'Expo SDK Documentation';
const DESCRIPTION =
  'Documentation for Expo SDK libraries, app configuration files, Expo CLI, create-expo-app, and more.';
const BUILD_OUTPUT_DIR = 'out';
const PATHS_TO_INCLUDE = ['versions/latest/', 'more/', 'technical-specs/'];

function findMarkdownFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMarkdownFiles(fullPath));
    } else if (entry.name === 'index.md') {
      results.push(fullPath);
    }
  }
  return results;
}

function generateFullMarkdown() {
  let fullContent = `# ${TITLE}\n\n${DESCRIPTION}\n\n`;

  const buildDir = path.join(process.cwd(), BUILD_OUTPUT_DIR);
  if (!fs.existsSync(buildDir)) {
    throw new Error(`Build output directory not found: ${buildDir}. Run "next build" first.`);
  }

  const allFiles = findMarkdownFiles(buildDir);

  const matchingFiles = allFiles
    .filter(filePath => {
      const relativePath = path.relative(buildDir, filePath).replace(/\\/g, '/');
      return PATHS_TO_INCLUDE.some(prefix => relativePath.startsWith(prefix));
    })
    .sort((a, b) => {
      const relA = path.relative(buildDir, a);
      const relB = path.relative(buildDir, b);
      return relA.localeCompare(relB);
    });

  const processedContent = new Set();

  for (const filePath of matchingFiles) {
    const content = fs.readFileSync(filePath, 'utf8').trim();
    if (!content) {
      continue;
    }

    const normalizedContent = content.toLowerCase();
    if (processedContent.has(normalizedContent)) {
      continue;
    }

    processedContent.add(normalizedContent);
    fullContent += content + '\n\n---\n\n';
  }

  return fullContent;
}

export async function generateLlmsSdkTxt() {
  try {
    const content = generateFullMarkdown();

    await fs.promises.mkdir(path.join(process.cwd(), OUTPUT_DIRECTORY_NAME), { recursive: true });

    const outputPath = path.join(process.cwd(), OUTPUT_DIRECTORY_NAME, OUTPUT_FILENAME);
    await fs.promises.writeFile(outputPath, content);

    console.log(` \x1b[1m\x1b[32m✓\x1b[0m Successfully generated ${OUTPUT_FILENAME}`);
  } catch (error) {
    console.error('Error generating SDK documentation:', error);
    throw error;
  }
}
