#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MARKDOWN_URL =
  'https://raw.githubusercontent.com/react-navigation/react-navigation.github.io/main/versioned_docs/version-7.x/native-stack-navigator.md';
const OUTPUT_FILE = path.join(__dirname, '../public/data/react-navigation-options.json');

async function fetchMarkdownContent() {
  const response = await fetch(MARKDOWN_URL);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.text();
}

function parseOptionsFromMarkdown(markdown) {
  const options = [];
  const optionsMatch = markdown.match(/### Options([\S\s]*?)(?=### (?:Events|Helpers|Hooks)|$)/);
  if (!optionsMatch) {
    return options;
  }

  const optionsSection = optionsMatch[1];
  const optionMatches = optionsSection.matchAll(
    /#### `([^`]+)`([\S\s]*?)(?=#### |##### |### |## |$)/g
  );

  for (const match of optionMatches) {
    const [, optionName, content] = match;

    if (
      optionName.includes('Event') ||
      optionName.includes('Helper') ||
      optionName.includes('Hook') ||
      optionName.startsWith('use') ||
      optionName.includes('transitionStart') ||
      optionName.includes('transitionEnd')
    ) {
      continue;
    }

    let platform = 'Both';
    if (content.includes('Only supported on iOS')) {
      platform = 'iOS only';
    } else if (content.includes('Only supported on Android')) {
      platform = 'Android only';
    }

    let description = content
      .replace(/^\s+/, '')
      .replace(/:::warning[\S\s]*?(?=\n\n|\n[A-Z]|$)/g, '')
      .replace(/:::note[\S\s]*?(?=\n\n|\n[A-Z]|$)/g, '')
      .replace(/:::/g, '')
      .replace(/Only supported on iOS\./g, '')
      .replace(/Only supported on Android\./g, '')
      .replace(/Only supported on Android and iOS\./g, '')
      .replace(/<img[^>]*>/g, '')
      .replace(/<video[^>]*>[\S\s]*?<\/video>/g, '')
      .replace(/Example:\s*\n\n```[\S\s]*?```/g, '')
      .replace(/Example:\s*\n\n[^\n]*\n/g, '')
      .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
      .trim();

    description = description
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\n\s*$/g, '')
      .trim();

    let category = 'other';
    if (optionName.toLowerCase().includes('header') || optionName.toLowerCase().includes('title')) {
      category = 'header';
    }

    options.push({
      name: optionName,
      description,
      platform,
      category,
    });
  }

  return options;
}

function saveOptionsToFile(options) {
  const outputData = {
    source: 'React Navigation Documentation (Markdown)',
    sourceUrl: MARKDOWN_URL,
    fetchedAt: new Date().toISOString(),
    totalOptions: options.length,
    categories: {
      header: options.filter(opt => opt.category === 'header').length,
      other: options.filter(opt => opt.category === 'other').length,
    },
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
    const markdown = await fetchMarkdownContent();
    const options = parseOptionsFromMarkdown(markdown);
    saveOptionsToFile(options);
    console.log(
      `✅ Fetched ${options.length} options (${options.filter(opt => opt.category === 'header').length} header, ${options.filter(opt => opt.category === 'other').length} other)`
    );
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
