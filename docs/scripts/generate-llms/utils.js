import frontmatter from 'front-matter';
import fs from 'node:fs';
import path from 'node:path';

export const OUTPUT_FILENAME_LLMS_TXT = 'llms.txt';
export const OUTPUT_DIRECTORY_NAME = 'public';
export const OUTPUT_FILENAME_EXPO_DOCS = 'llms-full.txt';
export const OUTPUT_FILENAME_EAS_DOCS = 'llms-eas.txt';
export const TITLE = 'Expo Documentation';
export const TITLE_EAS = 'Expo Application Services (EAS) Documentation';
export const DESCRIPTION =
  'Expo is an open-source React Native framework for apps that run natively on Android, iOS, and the web. Expo brings together the best of mobile and the web and enables many important features for building and scaling an app such as live updates, instantly sharing your app, and web support. The company behind Expo also offers Expo Application Services (EAS), which are deeply integrated cloud services for Expo and React Native apps.';
export const DESCRIPTION_EAS =
  'Expo Application Services (EAS) are deeply integrated cloud services for Expo and React Native apps, from the team behind Expo.';

export function processPageData(pageHref, pageName) {
  if (!pageHref || pageHref.startsWith('http')) {
    return null;
  }

  const filePath = path.join('pages', pageHref + '.mdx');
  const { title, description, content } = readFrontmatter(filePath);

  return title || pageName
    ? {
        title: title || pageName,
        url: `https://docs.expo.dev${pageHref}`,
        description,
        content,
      }
    : null;
}

function processPage(page) {
  return processPageData(page.href, page.name);
}

function processGroup(group) {
  const items = (group.children || [])
    .filter(child => child.type === 'page')
    .map(processPage)
    .filter(Boolean);

  return items.length ? { title: group.name, items } : null;
}

export function processSection(node) {
  if (node.type !== 'section') {
    return null;
  }

  const section = {
    title: node.name,
    items: [],
    groups: [],
    sections: [],
  };

  let pageData = null;
  let groupData = null;
  let sectionData = null;

  (node.children || []).forEach(child => {
    switch (child.type) {
      case 'page':
        pageData = processPage(child);
        if (pageData) {
          section.items.push(pageData);
        }
        break;
      case 'group':
        groupData = processGroup(child);
        if (groupData) {
          section.groups.push(groupData);
        }
        break;
      case 'section':
        sectionData = processSection(child);
        if (hasContent(sectionData)) {
          section.sections.push(sectionData);
        }
        break;
    }
  });

  return section;
}

export function hasContent(section) {
  return section?.items?.length || section?.groups?.length || section?.sections?.length;
}

export function readFrontmatter(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`File does not exist: ${filePath}`);
      return {};
    }
    const { attributes, body } = frontmatter(fs.readFileSync(filePath, 'utf-8'));
    return {
      title: attributes.title || '',
      description: attributes.description || '',
      content: cleanContent(body),
    };
  } catch (error) {
    console.warn(`Error reading MDX file ${filePath}:`, error.message);
    return {};
  }
}

export function cleanContent(content) {
  if (!content) {
    return '';
  }

  const parts = content.split(/(```[\S\s]*?```|```\w+[\S\s]*?```)/);

  const processed = parts.map((part, index) => {
    if (index % 2 === 1) {
      return part
        .split('\n')
        .filter(
          line =>
            !line.includes('/* @info') &&
            !line.includes('/* @hide') &&
            !line.includes('/* @end') &&
            !line.includes('/* @tutinfo')
        )
        .join('\n');
    }

    let processed = part
      .replace(/\/\*\s*@(?:info|hide)\s*\*\/(?:(?!\/\*\s*@end)[\S\s])*\/\*\s*@end\s*\*\//g, '')
      .replace(/{\s*\/\*\s*todo:\s*[\S\s]*?\*\/\s*}/gi, '')
      .replace(/\/\*\s*@tutinfo(?:\s*<CODE>.*?<\/CODE>)?.*?\*\//g, '')
      .replace(/<BoxLink[\S\s]+?\/>/g, '')
      .replace(/\s*<\/>\s*}\s*Icon={[^}]*}\s*\/>/g, '')
      .replace(/\s*}\s*href="[^"]*"\s*Icon={[^}]+}\s*\/>/g, '')
      .replace(/\s*}\s*(?:description="[^"]*"\s*)?href="[^"]*"\s*Icon={[^}]+}\s*\/>/g, '')
      .replace(/<CODE>[\S\s]*?<\/CODE>/g, '')
      .replace(/{\s*\/\*\s*prettier-ignore\s*\*\/\s*}/g, '')
      .replace(/{\s*\/\*\s*vale off\s*\*\/\s*}/g, '')
      .replace(/{\s*\/\*\s*vale on\s*\*\/\s*}/g, '')
      .replace(/<TabsGroup>/g, '')
      .replace(/<\/TabsGroup>/g, '')
      .replace(/<Tabs[^>]*>/g, '')
      .replace(/<\/Tabs>/g, '')
      .replace(/<Tab>/g, '')
      .replace(/<\/Tab>/g, '')
      .replace(/<Step label="([\d.]+)">/g, 'Step $1: ')
      .replace(/<\/Step>/g, '')
      .replace(/<SnackInline\s+label="([^"]+)"[^>]*>/g, '#### $1\n\n')
      .replace(/<\/SnackInline>/g, '')
      .replace(/<Collapsible summary={\s*<>([^<]*)<\/>\s*}>/g, 'Note: $1\n---\n')
      .replace(/<Collapsible summary="([^"]*)">/g, `Note: $1\n---\n`)
      .replace(/<\/Collapsible>/g, '\n---\n')
      .replace(/<Tab label="([^"]+)">/g, 'For $1: ')
      .replace(
        /<Pad{2}edAPIBox\s*header="([^"]+)"\s*platforms={\[(["'])([^\]]+)\2]}/g,
        (_, header, platform) => {
          const platformText = platform.includes('ios') ? ', iOS only' : ', Android only';
          return `#### ${header}${platformText}`;
        }
      )
      .replace(/<Pad{2}edAPIBox\s*platforms={\[(["'])([^\]]+)\1]}/g, (_, platform) => {
        return platform.includes('ios') ? '#### iOS Only' : '#### Android Only';
      })
      .replace(/<Pad{2}edAPIBox\s*header="([^"]+)"/g, '#### $1')
      .replace(/<PaddedAPIBox>/g, '')
      .replace(/<\/PaddedAPIBox>/g, '')
      .replace(/<CodeBlocksTable[^>]*>/g, '')
      .replace(/<\/CodeBlocksTable>/g, '')
      .replace(/<FileTree[\S\s]*?\/>/g, '')
      .replace(
        /<ContentSpotlight(?:\s+(?:src|file|alt|controls|caption|className|loop|containerClassName)(?:="[^"]*"|={`[^`]*`})?)*\s*\/>/g,
        ''
      )
      .replace(
        /<Diagram\s+source="[^"]*"\s+darkSource="[^"]*"\s+alt="[^"]*"(?:\s+[^>]*)?\s*\/>/g,
        ''
      )
      .replace(/<DiffBlock[^>]*raw={`([\S\s]*?)`}\s*\/>/g, (_, content) => {
        return '```diff\n' + content + '\n```';
      })
      .replace(
        /<VideoBoxLink\s+videoId="([^"]*)"\s+title="([^"]*)"\s*\/>/g,
        (_, videoId, title) =>
          `Video Tutorial: [${title}](https://www.youtube.com/watch?v=${videoId})`
      )
      .replace(
        /<VideoBoxLink\s+videoId="([^"]*)"\s+title="([^"]*)"\s+description="[^"]*"\s*\/>/g,
        (_, videoId, title) =>
          `Video Tutorial: [${title}](https://www.youtube.com/watch?v=${videoId})`
      )
      .replace(
        /<Terminal\s+(?:cmdCopy="[^"]*"\s*)?cmd={\[([\S\s]*?)]}\s*(?:cmdCopy="[^"]*")?\s*\/>/g,
        (_, cmds) => {
          const commands = cmds
            .split(',')
            .map(cmd => cmd.trim().replace(/^["']|["']$/g, ''))
            .filter(cmd => cmd && !cmd.startsWith('#'));
          return '```sh\n' + commands.join('\n') + '\n```';
        }
      )
      .replace(/<br\s*\/?>/g, '')
      .replace(/<PlatformAndDeviceForm\s*\/?>/g, '')
      .replace(/<DevelopmentModeForm\s*\/?>/g, '');

    if (index % 2 === 0) {
      processed = processed.replace(/^import\s+.*?from\s+["'].*?["'];?\s*\n/gm, '');
    }

    return processed;
  });

  return processed.join('').replace(/^\s*[\n\r]/gm, '');
}

function generateItemMarkdown(item) {
  let content = `## ${item.title}\n\n`;
  if (item.description) {
    content += `${item.description}\n\n`;
  }
  if (item.content) {
    content += `${item.content}\n\n`;
  }
  return content;
}

export function generateSectionMarkdown(section) {
  let content = section.title ? `# ${section.title}\n\n` : '';

  content += section.items.map(generateItemMarkdown).join('');

  section.groups.forEach(group => {
    if (group.items.length) {
      content += `# ${group.title}\n\n`;
      content += group.items.map(generateItemMarkdown).join('');
    }
  });

  section.sections.forEach(subSection => {
    if (subSection.title) {
      content += `# ${subSection.title}\n\n`;
    }
    content += subSection.items.map(generateItemMarkdown).join('');
  });

  return content;
}
