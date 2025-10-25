#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCES = [
  {
    id: 'native-stack-navigator',
    name: 'Native Stack Navigator',
    url: 'https://raw.githubusercontent.com/react-navigation/react-navigation.github.io/main/versioned_docs/version-7.x/native-stack-navigator.md',
    includeOption: () => true,
    preprocessOptionContent(optionName, content, optionsSection) {
      if (optionName !== 'headerSearchBarOptions') {
        return content;
      }

      const startIndex = optionsSection.indexOf('#### `headerSearchBarOptions`');
      const nextHeaderIndex = optionsSection.indexOf('#### `header`', startIndex);
      if (startIndex !== -1 && nextHeaderIndex !== -1) {
        return optionsSection
          .slice(startIndex, nextHeaderIndex)
          .replace('#### `headerSearchBarOptions`', '');
      }

      return content;
    },
    resolveCategory(optionName) {
      const lowerName = optionName.toLowerCase();
      if (lowerName.includes('header') || lowerName.includes('title')) {
        return 'header';
      }
      return 'other';
    },
  },
  {
    id: 'bottom-tab-navigator',
    name: 'Bottom Tab Navigator',
    url: 'https://raw.githubusercontent.com/react-navigation/react-navigation.github.io/main/versioned_docs/version-7.x/bottom-tab-navigator.md',
    includeOption(optionName) {
      return optionName.toLowerCase().startsWith('tabbar');
    },
    preprocessOptionContent: (_, content) => content,
    resolveCategory: () => 'tabBar',
  },
];
const OUTPUT_FILE = path.join(__dirname, '../public/data/react-navigation-options.json');

async function fetchMarkdownContent(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.text();
}

function parseOptionsFromMarkdown(markdown, config) {
  const options = [];
  const optionsMatch = markdown.match(/### Options([\S\s]*?)(?=### (?:Events|Helpers|Hooks)|$)/);
  if (!optionsMatch) {
    return options;
  }

  const optionsSection = optionsMatch[1];
  const h5Properties = new Set();
  const h5Matches = optionsSection.matchAll(/##### `([^`]+)`/g);
  for (const match of h5Matches) {
    h5Properties.add(match[1]);
  }

  const optionMatches = optionsSection.matchAll(/#### `([^`]+)`([\S\s]*?)(?=#### `[^`]+`|### |$)/g);

  for (const match of optionMatches) {
    const [, optionName, content] = match;
    const lowerName = optionName.toLowerCase();

    if (h5Properties.has(optionName)) {
      continue;
    }
    if (
      lowerName.includes('event') ||
      lowerName.includes('helper') ||
      lowerName.includes('hook') ||
      lowerName.startsWith('use') ||
      lowerName.includes('transitionstart') ||
      lowerName.includes('transitionend')
    ) {
      continue;
    }

    if (typeof config.includeOption === 'function' && !config.includeOption(optionName, content)) {
      continue;
    }

    let rawContent = content;

    if (typeof config.preprocessOptionContent === 'function') {
      rawContent = config.preprocessOptionContent(optionName, rawContent, optionsSection);
    }

    let platform = 'Both';
    if (rawContent.includes('Only supported on iOS')) {
      platform = 'iOS only';
    } else if (rawContent.includes('Only supported on Android')) {
      platform = 'Android only';
    }

    let description = rawContent
      .replace(/^\s+/, '')
      .replace(/:::warning[\S\s]*?(?=\n\n|\n[A-Z]|$)/g, '')
      .replace(/:::note[\S\s]*?(?=\n\n|\n[A-Z]|$)/g, '')
      .replace(/:::/g, '')
      .replace(/<Tabs[\S\s]*?<\/Tabs>/g, tabsBlock => {
        const codeBlocks = Array.from(tabsBlock.matchAll(/```[\S\s]*?```/g)).map(match => match[0]);
        if (codeBlocks.length === 0) {
          return '';
        }
        return `\n\n${codeBlocks.join('\n\n')}\n\n`;
      })
      .replace(/<\/img>/g, '')
      .replace(/Only supported on iOS\./g, '')
      .replace(/Only supported on Android\./g, '')
      .replace(/Only supported on Android and iOS\./g, '')
      .replace(/<img[^>]*>/g, '')
      .replace(/<video[^>]*>[\S\s]*?<\/video>/g, '')
      .replace(/Example:\s*\n\n```[\S\s]*?```/g, '')
      .replace(/Example:\s*\n\n[^\n]*\n/g, '')
      .replace(/!\[([^\]]*)]\([^)]+\)/g, '')
      .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
      .replace(/\n\s*(Android|iOS):\s*\n\s*(?=\n|$)/g, '')
      .replace(/##### `([^`]+)`/g, '\n\n**$1**')
      .replace(/##### ([^\n]+)/g, '\n\n**$1**')
      .replace(/#{1,6}\s*/g, '')
      .trim();

    description = description.replace(
      /Supported values:\s*\n\n([\S\s]*?)(?=\n\n[A-Z]|\n\n\*\*|$)/g,
      (match, listContent) => {
        const values = [];
        const valueMatches = listContent.matchAll(/- `([^`]+)`/g);
        for (const valueMatch of valueMatches) {
          values.push(valueMatch[1]);
        }

        if (values.length > 0) {
          return `Supported values: ${values.map(val => `\`${val}\``).join(', ')}`;
        }
        return match;
      }
    );

    description = description
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\n\s*$/g, '')
      .trim();

    const category =
      typeof config.resolveCategory === 'function'
        ? config.resolveCategory(optionName, description)
        : null;

    if (optionName === 'tabBarPosition') {
      description = description
        .replace(/```[\S\s]*?createBottomTabNavigator[\S\s]*?```/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    if (!category) {
      continue;
    }

    options.push({ name: optionName, description, platform, category });
  }

  return options;
}

function saveOptionsToFile(options) {
  const categoryCounts = options.reduce((acc, option) => {
    acc[option.category] = (acc[option.category] ?? 0) + 1;
    return acc;
  }, {});

  const outputData = {
    sources: SOURCES.map(source => ({
      id: source.id,
      name: source.name,
      url: source.url,
    })),
    fetchedAt: new Date().toISOString(),
    totalOptions: options.length,
    categories: categoryCounts,
    options,
  };

  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2));
}

async function main() {
  try {
    const allOptions = [];

    for (const source of SOURCES) {
      const markdown = await fetchMarkdownContent(source.url);
      const options = parseOptionsFromMarkdown(markdown, source).map(option => ({
        ...option,
        origin: source.id,
      }));

      allOptions.push(...options);

      console.log(`✅ ${source.name}: ${options.length} options`);
    }

    saveOptionsToFile(allOptions);

    const summary = Object.entries(
      allOptions.reduce((acc, option) => {
        acc[option.category] = (acc[option.category] ?? 0) + 1;
        return acc;
      }, {})
    )
      .map(([category, count]) => `${category}: ${count}`)
      .join(', ');

    console.log(`✅ Saved ${allOptions.length} options (${summary})`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
