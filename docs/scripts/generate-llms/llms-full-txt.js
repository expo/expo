import fs from 'node:fs';
import path from 'node:path';

import {
  OUTPUT_DIRECTORY_NAME,
  OUTPUT_FILENAME_EXPO_DOCS,
  TITLE,
  DESCRIPTION,
  generateSectionMarkdown,
  processSection,
  readFrontmatter,
} from './utils.js';
import { home, learn, general } from '../../constants/navigation.js';

function readInstructions() {
  const instructionsDir = path.join(
    process.cwd(),
    'scenes/get-started/set-up-your-environment/instructions'
  );

  const headerMapping = {
    _androidEmulatorInstructions: 'Android Emulator Setup',
    _androidStudioEnvironmentInstructions: 'Android Studio Environment Setup',
    _androidStudioInstructions: 'Android Studio Setup',
    _xcodeInstructions: 'Xcode Setup',
    androidPhysicalDevelopmentBuild:
      'Create a development build for a physical Android device with EAS',
    androidPhysicalDevelopmentBuildLocal:
      'Create a development build for a physical Android device locally',
    androidPhysicalExpoGo: 'Run on a physical Android device with Expo Go',
    androidSimulatedDevelopmentBuild: 'Create a development build for Android Emulator with EAS',
    androidSimulatedDevelopmentBuildLocal:
      'Create a development build for Android Emulator locally',
    androidSimulatedExpoGo: 'Run on Android Emulator with Expo Go',
    iosPhysicalDevelopmentBuild: 'Create a development build for a physical iOS device with EAS',
    iosPhysicalDevelopmentBuildLocal:
      'Create a development build for a physical iOS device locally',
    iosPhysicalExpoGo: 'Run on a physical iOS device with Expo Go',
    iosSimulatedDevelopmentBuild: 'Create a development build for iOS Simulator with EAS',
    iosSimulatedDevelopmentBuildLocal: 'Create a development build for iOS Simulator locally',
    iosSimulatedExpoGo: 'Run on iOS Simulator with Expo Go',
  };

  const instructionFiles = Object.keys(headerMapping);

  return instructionFiles
    .map(filename => {
      const filePath = path.join(instructionsDir, `${filename}.mdx`);
      if (fs.existsSync(filePath)) {
        const { title, content } = readFrontmatter(filePath);
        const header = headerMapping[filename] || title || filename;
        return `# ${header}\n\n${content}\n\n`;
      }
      return '';
    })
    .join('');
}

function processEnvironmentPage(section) {
  if (section.items) {
    section.items = section.items.map(item => {
      if (item.url && item.url.includes('set-up-your-environment')) {
        const instructions = readInstructions();
        item.content = item.content.replace('<DevelopmentEnvironmentInstructions />', instructions);
      }
      return item;
    });
  }

  if (section.sections) {
    section.sections = section.sections.map(processEnvironmentPage);
  }

  return section;
}

function generateFullMarkdown({ title, description, sections }) {
  return `# ${title}\n\n${description}\n\n` + sections.map(generateSectionMarkdown).join('');
}

export async function generateLlmsFullTxt() {
  try {
    const sections = [
      ...home.map(section => ({ ...processSection(section), category: 'Home' })),
      ...learn.map(section => ({ ...processSection(section), category: 'Learn' })),
      ...general.map(section => ({ ...processSection(section), category: 'General' })),
    ].map(processEnvironmentPage);

    await fs.promises.writeFile(
      path.join(process.cwd(), OUTPUT_DIRECTORY_NAME, OUTPUT_FILENAME_EXPO_DOCS),
      generateFullMarkdown({
        title: TITLE,
        description: DESCRIPTION,
        sections,
      })
    );

    console.log(` \x1b[1m\x1b[32m✓\x1b[0m Successfully generated ${OUTPUT_FILENAME_EXPO_DOCS}`);
  } catch (error) {
    console.error('Error generating llms-full.txt:', error);
    process.exit(1);
  }
}
