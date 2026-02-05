import fs from 'node:fs';
import path from 'node:path';

import { extractAttribute, resolveSchemaPath } from './shared-utils.js';

export function replaceBoxLinks(content) {
  let result = '';
  let cursor = 0;
  const startTag = '<BoxLink';

  while (cursor < content.length) {
    const start = content.indexOf(startTag, cursor);
    if (start === -1) {
      result += content.slice(cursor);
      break;
    }
    result += content.slice(cursor, start);

    const selfClose = content.indexOf('/>', start);
    const blockClose = content.indexOf('</BoxLink>', start);
    let end;
    if (blockClose !== -1 && (selfClose === -1 || blockClose < selfClose)) {
      end = blockClose + '</BoxLink>'.length;
    } else if (selfClose !== -1) {
      end = selfClose + 2;
    } else {
      result += content.slice(start);
      break;
    }

    const component = content.slice(start, end);
    const title = extractAttribute(component, 'title');
    const href = extractAttribute(component, 'href');

    if (title && href) {
      const normalizedHref = href.startsWith('http') ? href : `https://docs.expo.dev${href}`;
      result += `\n[${title}](${normalizedHref})\n`;
    } else if (title) {
      result += `\n${title}\n`;
    }

    cursor = end;
  }
  return result;
}

export function replaceContentSpotlights(content) {
  return content.replace(
    /<ContentSpotlight[^>]*?(?:alt=["']([^"']*)["'][^>]*?)?src=["']([^"']+)["'][^>]*?\/>/g,
    (_m, alt, src) => {
      if (!src) {
        return '';
      }
      const url = src.startsWith('http') ? src : `https://docs.expo.dev${src}`;
      return `[${alt || 'Screenshot'}](${url})`;
    }
  );
}

export function replaceInstallSections(content, packageName) {
  return content.replace(/<(?:API)?InstallSection\s*([^>]*)\/>/g, (_m, attrs) => {
    const cmd = extractAttribute(attrs, 'packageName') || packageName;
    if (!cmd) {
      return '';
    }
    return `\n\`\`\`bash\n$ npx expo install ${cmd}\n\`\`\`\n`;
  });
}

export function replaceConfigPluginProperties(content) {
  return content.replace(/<ConfigPluginProperties\s+([\S\s]*?)\/>/g, (_m, attrs) => {
    try {
      const propsMatch = attrs.match(/properties={(\[[\S\s]*?])}/);
      if (!propsMatch) {
        return '';
      }
      // eslint-disable-next-line no-new-func
      const properties = new Function(`return (${propsMatch[1]})`)();
      if (!Array.isArray(properties) || properties.length === 0) {
        return '';
      }
      const header = [
        '### Configurable properties',
        '| Name | Default | Description |',
        '| --- | --- | --- |',
      ];
      const rows = properties.map(p => {
        const name = p.name ? `\`${p.name}\`` : '-';
        const def = p.default != null ? `\`${p.default}\`` : '-';
        const desc = p.description || '-';
        return `| ${name} | ${def} | ${desc} |`;
      });
      return `\n${[...header, ...rows].join('\n')}\n`;
    } catch {
      return '';
    }
  });
}

export function replaceAppConfigSchemaTables(content, schemaImports) {
  return content.replace(/<AppConfigSchemaTable\s+schema={(\w+)}\s*\/>/g, (_m, identifier) => {
    const importPath = schemaImports[identifier];
    if (!importPath) {
      return '';
    }
    const resolved = resolveSchemaPath(importPath);
    if (!resolved || !fs.existsSync(resolved)) {
      return '';
    }
    try {
      const schema = JSON.parse(fs.readFileSync(resolved, 'utf-8'));
      const rows = [];
      for (const [name, property] of Object.entries(schema)) {
        appendAppConfigProperty(rows, name, property, '', 0);
      }
      if (rows.length === 0) {
        return '';
      }
      return `\n| Property | Description |\n| --- | --- |\n${rows.join('\n')}\n`;
    } catch {
      return '';
    }
  });
}

function appendAppConfigProperty(rows, name, property, parentPath, level) {
  if (property?.meta?.hidden || property?.meta?.deprecated) {
    return;
  }
  const fullName = parentPath ? `${parentPath}.${name}` : name;
  const indent = level === 0 ? '' : '&nbsp;'.repeat(level * 4) + '• ';
  const nameCell = `${indent}\`${fullName}\``;
  const parts = [];
  const type = property?.type
    ? Array.isArray(property.type)
      ? property.type.join(' || ')
      : property.type
    : '';
  if (type) {
    parts.push(`**(${type})**`);
  }
  if (property?.description) {
    parts.push(property.description);
  }
  const desc = parts.join(' - ').replace(/\|/g, '\\|');
  rows.push(`| ${nameCell.replace(/\|/g, '\\|')} | ${desc} |`);
  if (property?.properties) {
    for (const [childName, childProp] of Object.entries(property.properties)) {
      appendAppConfigProperty(rows, childName, childProp, fullName, level + 1);
    }
  }
}

export function resolveDiffSource(source) {
  if (!source) {
    return '';
  }
  // Source paths reference local files relative to docs root
  const localPath = source.startsWith('/') ? path.join(process.cwd(), 'public', source) : '';
  if (localPath && fs.existsSync(localPath)) {
    return fs.readFileSync(localPath, 'utf-8');
  }
  return '';
}

export function replaceIcons(content) {
  return content
    .replace(/<YesIcon[^>]*\/>/g, 'Yes')
    .replace(/<NoIcon[^>]*\/>/g, 'No')
    .replace(/<WarningIcon[^>]*\/>/g, 'Warning')
    .replace(/<AlertIcon[^>]*\/>/g, 'Alert')
    .replace(/<PendingIcon[^>]*\/>/g, 'Pending');
}

export function replacePrerequisites(content) {
  return content
    .replace(/<Prerequisites[^>]*>/g, '')
    .replace(/<\/Prerequisites>/g, '')
    .replace(
      /<Requirement\s+number={(\d+)}\s+title="([^"]+)">/g,
      (_m, num, title) => `### ${num}. ${title}\n\n`
    )
    .replace(/<\/Requirement>/g, '');
}

export function replacePlatformTags(content) {
  return content
    .replace(/<PlatformTag\s+platform="([^"]+)"\s*\/>/g, (_m, platform) => {
      const label = platform.charAt(0).toUpperCase() + platform.slice(1);
      return `**${label}**`;
    })
    .replace(/<PlatformTags\s+[^>]*platforms={\[([^\]]+)]}\s*\/>/g, (_m, platforms) => {
      const labels = platforms
        .replace(/["']/g, '')
        .split(',')
        .map(p => p.trim())
        .filter(Boolean)
        .map(p => p.charAt(0).toUpperCase() + p.slice(1));
      return `**${labels.join(', ')}**`;
    });
}

export function replaceStatusTags(content) {
  let result = content;
  result = result.replace(/<StatusTag\s+note="([^"]+)"\s*\/>/g, '($1)');
  result = result.replace(
    /<StatusTag\s+status="([^"]+)"\s+note="([^"]+)"\s*\/>/g,
    (_m, status, note) => `(${status}, ${note})`
  );
  result = result.replace(/<StatusTag\s+status="([^"]+)"\s*\/>/g, (_m, status) => `(${status})`);
  result = result.replace(/<div\s+class(?:Name)?="[^"]*">\s*(\([^)]+\))\s*<\/div>/g, '$1');
  return result;
}

export function replaceCopyTextButtons(content) {
  return content.replace(/<CopyTextButton>([\S\s]*?)<\/CopyTextButton/g, '$1');
}

export function replaceConfigReactNative(content) {
  let result = content.replace(
    /<ConfigReactNative\s+title="([^"]+)">([\S\s]*?)<\/ConfigReactNative>/g,
    (_m, title, body) => `\n**${title}**\n\n${body.trim()}\n`
  );
  result = result.replace(
    /<ConfigReactNative[^>]*>([\S\s]*?)<\/ConfigReactNative>/g,
    (_m, body) => `\n**Are you using this in a bare React Native app?**\n\n${body.trim()}\n`
  );
  return result;
}

const BUILD_RESOURCES = {
  android: [
    '- `medium`: 4 vCPUs, 16 GB RAM ([n2-standard-4](https://cloud.google.com/compute/docs/general-purpose-machines#n2_machine_types) or [c3d-standard-4](https://cloud.google.com/compute/docs/general-purpose-machines#c3d_machine_types) Google Cloud machine type)',
    '- `large`: 8 vCPUs, 32 GB RAM ([n2-standard-8](https://cloud.google.com/compute/docs/general-purpose-machines#n2_machine_types) or [c3d-standard-8](https://cloud.google.com/compute/docs/general-purpose-machines#c3d_machine_types) Google Cloud machine type)',
  ],
  ios: [
    '- `medium`: 5 performance cores, 20 GiB RAM, 110 GB SSD',
    '- `large`: 10 performance cores, 40 GiB RAM, 110 GB SSD',
  ],
};

export function replaceBuildResourceList(content) {
  return content.replace(/<BuildResourceList\s+platform="([^"]+)"\s*\/>/g, (_m, platform) => {
    const specs = BUILD_RESOURCES[platform];
    if (!specs) {
      return '';
    }
    return `\n${specs.join('\n')}\n`;
  });
}

export function replaceTerminalObjectCmd(content) {
  return content.replace(/<Terminal\s[\S\s]*?cmd={({[\S\s]*?})}[\S\s]*?\/>/g, (_m, cmdObj) => {
    // Try to extract the first package manager's commands from the object
    const entryMatch = cmdObj.match(/(?:npm|yarn|pnpm|bun)\s*:\s*\[([\S\s]*?)]/);
    if (!entryMatch) {
      return '';
    }
    const commands = Array.from(entryMatch[1].matchAll(/["']([^"']*)["']/g))
      .map(m => m[1].trim())
      .filter(Boolean);
    if (commands.length === 0) {
      return '';
    }
    return `\n\n\`\`\`bash\n${commands.join('\n')}\n\`\`\`\n\n`;
  });
}

export function replaceVideoBoxLinks(content) {
  return content.replace(/<VideoBoxLink\s+([\S\s]*?)\/>/g, (_m, attrs) => {
    const videoId = extractAttribute(attrs, 'videoId');
    const title = extractAttribute(attrs, 'title');
    if (!videoId || !title) {
      return '';
    }
    return `Video: [${title}](https://www.youtube.com/watch?v=${videoId})`;
  });
}

export function replaceApiMethods(content) {
  return content.replace(/<APIMethod\s+([\S\s]*?)\/>/g, (_m, attrs) => {
    const name = extractAttribute(attrs, 'name');
    const returnType = extractAttribute(attrs, 'returnTypeName');
    const comment = extractAttribute(attrs, 'comment');

    const paramsMatch = attrs.match(/parameters={\[([\S\s]*?)]}/);
    let paramNames = [];
    if (paramsMatch) {
      paramNames = Array.from(paramsMatch[1].matchAll(/name:\s*["']([^"']+)["']/g)).map(m => m[1]);
    }

    const lines = [];
    const sig = `${name || 'method'}(${paramNames.join(', ')})`;
    lines.push(`#### \`${sig}\`${returnType ? ` -> \`${returnType}\`` : ''}`);
    if (comment) {
      lines.push(comment);
    }

    if (paramsMatch) {
      const paramEntries = paramsMatch[1].split(/},\s*{/).map(s => s.replace(/^[[{]|[\]}]$/g, ''));
      for (const entry of paramEntries) {
        const pName = entry.match(/name:\s*["']([^"']+)["']/)?.[1];
        const pType = entry.match(/typeName:\s*["']([^"']+)["']/)?.[1];
        const pComment = entry.match(/comment:\s*["']([^"']+)["']/)?.[1];
        if (pName) {
          lines.push(
            `- \`${pName}\`${pType ? ` (\`${pType}\`)` : ''}${pComment ? ` — ${pComment}` : ''}`
          );
        }
      }
    }

    return `\n${lines.join('\n\n')}\n`;
  });
}

export function replaceProgressTracker(content) {
  return content.replace(/<ProgressTracker\s+([\S\s]*?)\/>/g, (_m, attrs) => {
    const summary = extractAttribute(attrs, 'summary');
    const nextTitle = extractAttribute(attrs, 'nextChapterTitle');
    const nextLink = extractAttribute(attrs, 'nextChapterLink');
    const nextDesc = extractAttribute(attrs, 'nextChapterDescription');

    const lines = [];
    if (summary) {
      lines.push(summary);
    }
    if (nextTitle && nextLink) {
      const url = nextLink.startsWith('http') ? nextLink : `https://docs.expo.dev${nextLink}`;
      lines.push(`**Next:** [${nextTitle}](${url})`);
    }
    if (nextDesc) {
      lines.push(nextDesc);
    }
    return lines.length > 0 ? `\n${lines.join('\n\n')}\n` : '';
  });
}

export function replaceDownloadSlide(content) {
  return content.replace(/<DownloadSlide\s+([\S\s]*?)\/>/g, (_m, attrs) => {
    const title = extractAttribute(attrs, 'title');
    const description = extractAttribute(attrs, 'description');
    const imageUrl = extractAttribute(attrs, 'imageUrl');
    const lines = [];
    if (title) {
      lines.push(`**${title}**`);
    }
    if (description) {
      lines.push(description);
    }
    if (imageUrl) {
      const url = imageUrl.startsWith('http') ? imageUrl : `https://docs.expo.dev${imageUrl}`;
      lines.push(`[${title || 'Download'}](${url})`);
    }
    return lines.length > 0 ? `\n${lines.join('\n\n')}\n` : '';
  });
}

export function replaceCollapsibleJsxFragments(content) {
  let result = content;
  result = result.replace(/<Collapsible\s+summary={\s*<>([\S\s]*?)<\/>\s*}>/g, (_m, inner) => {
    const text = inner
      .replace(/<span><i>([^<]*)<\/i><\/span>/g, '_$1_')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return `**${text}**\n\n`;
  });
  result = result.replace(
    /<Collapsible\s+summary={`([^`]+)`}>/g,
    (_m, text) => `**${text.trim()}**\n\n`
  );
  result = result.replace(
    /<Collapsible\s+summary={`([^`]+)`}\s+\w+>/g,
    (_m, text) => `**${text.trim()}**\n\n`
  );
  result = result.replace(
    /<Collapsible\s+summary="([^"]+)"[^>]*>/g,
    (_m, text) => `**${text.trim()}**\n\n`
  );
  return result;
}

export function replaceJsxExpressions(content) {
  let result = content;
  result = result.replace(/{\s*\/\*[\S\s]*?\*\/\s*}/g, '');
  result = result.replace(/{\s*'([^']*)'\s*}/g, '$1');
  result = result.replace(/<>\s*/g, '');
  result = result.replace(/<\/>\s*/g, '');
  result = result.replace(/\bclassName=/g, 'class=');
  return result;
}

export function replaceMetadataTables(content) {
  return content.replace(/<MetadataTable[^>]*>([\S\s]*?)<\/MetadataTable>/g, (_m, inner) => {
    try {
      let cleaned = inner;
      cleaned = cleaned.replace(
        /<MD\.a[^>]*href="([^"]*)"[^>]*>([\S\s]*?)<\/MD\.a>/g,
        (_m2, href, text) => `'[${text.trim()}](${href})'`
      );
      cleaned = cleaned.replace(
        /<MD\.p>([\S\s]*?)<\/MD\.p>/g,
        (_m2, text) => `'${text.trim().replace(/'/g, "\\'")}'`
      );
      cleaned = cleaned.replace(
        /<MD\.code>([\S\s]*?)<\/MD\.code>/g,
        (_m2, text) => `'\`${text.trim()}\`'`
      );
      cleaned = cleaned.replace(
        /<MD\.li>([\S\s]*?)<\/MD\.li>/g,
        (_m2, text) => `'- ${text.trim().replace(/'/g, "\\'")}'`
      );
      cleaned = cleaned.replace(/<MD\.ul>([\S\s]*?)<\/MD\.ul>/g, '$1');
      cleaned = cleaned.replace(/<>\s*/g, '');
      cleaned = cleaned.replace(/<\/>\s*/g, '');
      cleaned = cleaned.replace(/{\s*'([^']*)'\s*}/g, "'$1'");
      cleaned = cleaned.replace(/\(\s*('[^']*')\s*\)/g, '$1');
      cleaned = cleaned.replace(
        /description:\s*\[\s*((?:'[^']*'(?:\s*,\s*)?)+)\s*]/g,
        (_m2, items) => {
          const joined = items
            .split(/'\s*,\s*'/)
            .map(s => s.replace(/^'|'$/g, '').trim())
            .filter(Boolean)
            .join(' ');
          return `description: '${joined.replace(/'/g, "\\'")}'`;
        }
      );
      cleaned = cleaned.replace(
        /<MetadataSubcategories>([\S\s]*?)<\/MetadataSubcategories>/g,
        '$1'
      );

      // eslint-disable-next-line no-new-func
      const entries = new Function(`return (${cleaned.trim()})`)();
      if (!Array.isArray(entries) || entries.length === 0) {
        return '';
      }

      const rows = entries.map(entry => {
        const indent = entry.nested ? '&nbsp;'.repeat(entry.nested * 4) + '- ' : '';
        const name = `${indent}\`${entry.name}\``;
        const parts = [];
        if (entry.type) {
          parts.push(`**(${entry.type})**`);
        }
        if (entry.rules) {
          parts.push(entry.rules.join(', '));
        }
        if (entry.description) {
          parts.push(String(entry.description));
        }
        const desc = parts.join(' — ').replace(/\|/g, '\\|');
        return `| ${name.replace(/\|/g, '\\|')} | ${desc} |`;
      });

      return `\n| Property | Description |\n| --- | --- |\n${rows.join('\n')}\n`;
    } catch {
      let fallback = inner;
      fallback = fallback.replace(
        /<MD\.a[^>]*href="([^"]*)"[^>]*>([\S\s]*?)<\/MD\.a>/g,
        '[$2]($1)'
      );
      fallback = fallback.replace(/<MD\.\w+[^>]*>/g, '');
      fallback = fallback.replace(/<\/MD\.\w+>/g, '');
      fallback = fallback.replace(/<[^>]+>/g, '');
      fallback = fallback.replace(/[{}]/g, '');
      return fallback.trim() ? `\n${fallback.trim()}\n` : '';
    }
  });
}

export function replaceReactNavigationOptions(content) {
  return content.replace(/<ReactNavigationOptions\s+([^>]*)\/>/g, (_m, attrs) => {
    const category = extractAttribute(attrs, 'category');
    const excludeMatch = attrs.match(/excludeCategories={\[([^\]]+)]}/);
    const excludeCategories = excludeMatch
      ? excludeMatch[1]
          .replace(/["']/g, '')
          .split(',')
          .map(s => s.trim())
      : [];

    const dataPath = path.join(process.cwd(), 'public/data/react-navigation-options.json');
    if (!fs.existsSync(dataPath)) {
      return '';
    }

    try {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      let options = data.options || [];

      if (category) {
        options = options.filter(o => o.category === category);
      }
      if (excludeCategories.length > 0) {
        options = options.filter(o => !excludeCategories.includes(o.category));
      }
      if (options.length === 0) {
        return '';
      }

      const header = '| Option | Platform | Description |\n| --- | --- | --- |';
      const rows = options.map(o => {
        const name = `\`${o.name}\``;
        const platform = o.platform || 'Both';
        const desc = (o.description || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
        return `| ${name} | ${platform} | ${desc} |`;
      });

      const title = category
        ? `### ${category.charAt(0).toUpperCase() + category.slice(1)} options`
        : '### Navigation options';
      return `\n${title}\n\n${header}\n${rows.join('\n')}\n`;
    } catch {
      return '';
    }
  });
}

let _talksCache = null;

async function loadTalksData() {
  if (_talksCache) {
    return _talksCache;
  }
  try {
    const talks = await import('../talks.js');
    _talksCache = {
      TALKS: talks.TALKS || [],
      PODCASTS: talks.PODCASTS || [],
      LIVE_STREAMS: talks.LIVE_STREAMS || [],
      YOUTUBE_VIDEOS: talks.YOUTUBE_VIDEOS || [],
    };
  } catch {
    _talksCache = { TALKS: [], PODCASTS: [], LIVE_STREAMS: [], YOUTUBE_VIDEOS: [] };
  }
  return _talksCache;
}

export async function replaceCollapsibleTalksGrid(content) {
  if (!content.includes('CollapsibleTalksGridWrapper')) {
    return content;
  }

  const talks = await loadTalksData();
  const mapping = {
    TALKS: talks.TALKS,
    PODCASTS: talks.PODCASTS,
    LIVE_STREAMS: talks.LIVE_STREAMS,
    YOUTUBE_VIDEOS: talks.YOUTUBE_VIDEOS,
  };

  return content.replace(/<CollapsibleTalksGridWrapper\s+items={(\w+)}\s*\/>/g, (_m, varName) => {
    const items = mapping[varName];
    if (!items || items.length === 0) {
      return '';
    }
    const lines = items.map(item => {
      const url =
        item.link || (item.videoId ? `https://www.youtube.com/watch?v=${item.videoId}` : '');
      const parts = [];
      if (url) {
        parts.push(`[${item.title}](${url})`);
      } else {
        parts.push(item.title);
      }
      if (item.event) {
        parts[0] += ` — ${item.event}`;
      }
      if (item.description) {
        parts.push(item.description);
      }
      return `- ${parts.join('. ')}`;
    });
    return `\n${lines.join('\n')}\n`;
  });
}

export function replaceInstructionScenes(content) {
  const sceneMap = {
    AndroidStudioEnvironmentInstructions:
      'scenes/get-started/set-up-your-environment/instructions/_androidStudioEnvironmentInstructions.mdx',
    AndroidStudioInstructions:
      'scenes/get-started/set-up-your-environment/instructions/_androidStudioInstructions.mdx',
    AndroidEmulatorInstructions:
      'scenes/get-started/set-up-your-environment/instructions/_androidEmulatorInstructions.mdx',
    XcodeInstructions:
      'scenes/get-started/set-up-your-environment/instructions/_xcodeInstructions.mdx',
  };

  let result = content;
  for (const [component, scenePath] of Object.entries(sceneMap)) {
    const regex = new RegExp(`<${component}\\s*/>`, 'g');
    if (!regex.test(result)) {
      continue;
    }

    const filePath = path.join(process.cwd(), scenePath);
    if (!fs.existsSync(filePath)) {
      result = result.replace(new RegExp(`<${component}\\s*/>`, 'g'), '');
      continue;
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    let body = raw.replace(/^---[\S\s]*?---\n?/, '');
    body = body.replace(/^import\s.+$\n?/gm, '');
    body = body.replace(/<Tabs[^>]*>/g, '');
    body = body.replace(/<\/Tabs>/g, '');
    body = body.replace(/<Tab\s+label=["']([^"']+)["'][^>]*>/g, (_m, label) => `#### ${label}\n\n`);
    body = body.replace(/<\/Tab>/g, '\n');
    body = body.replace(
      /<Step\s+label=["']([^"']+)["'][^>]*>/g,
      (_m, label) => `### Step ${label}\n\n`
    );
    body = body.replace(/<\/Step>/g, '\n');
    body = body.replace(/<Terminal[^>]*cmd={(\[[^]*?])}[^>]*\/>/g, (_m, arr) => {
      const commands = Array.from(arr.matchAll(/["']([^"']*)["']/g))
        .map(m => m[1].trim())
        .filter(Boolean);
      return commands.length > 0 ? `\n\`\`\`bash\n${commands.join('\n')}\n\`\`\`\n` : '';
    });
    body = body.replace(
      /<ContentSpotlight[^>]*?(?:alt=["']([^"']*)["'][^>]*?)?src=["']([^"']+)["'][^>]*?\/>/g,
      (_m, alt, src) => {
        if (!src) {
          return '';
        }
        const url = src.startsWith('http') ? src : `https://docs.expo.dev${src}`;
        return `[${alt || 'Screenshot'}](${url})`;
      }
    );
    body = body.replace(
      /<Collapsible[^>]*summary=["']([^"']+)["'][^>]*>/g,
      (_m, s) => `**${s}**\n\n`
    );
    body = body.replace(/<\/Collapsible>/g, '\n');
    body = body.replace(/<br\s*\/>/g, '\n');
    body = body.replace(/<[A-Z][A-Za-z]*[^>]*\/?>/g, '');
    body = body.replace(/<\/[A-Z][A-Za-z]*>/g, '');
    body = body
      .split('\n')
      .map(l => l.trimEnd())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    result = result.replace(new RegExp(`<${component}\\s*/>`, 'g'), `\n${body}\n`);
  }
  return result;
}

export function stripNonConvertibleComponents(content) {
  return content
    .replace(/<ConfigPluginHierarchy[^>]*\/>/g, '')
    .replace(/<TemplateBareMinimumDiffViewer\s*\/>/g, '')
    .replace(/<PossibleRedirectNotification[^>]*\/>/g, '')
    .replace(/<SnackInline[^>]*>/g, '')
    .replace(/<\/SnackInline>/g, '')
    .replace(/<ThemedView[^>]*>/g, '')
    .replace(/<\/ThemedView>/g, '');
}

export function replaceBoxComponents(content) {
  return content
    .replace(/<Box\s+name="([^"]+)"[^>]*>/g, (_m, name) => `\n### ${name}\n\n`)
    .replace(/<\/Box>/g, '');
}

export function replaceContentSpotlightFiles(content) {
  return content.replace(/<ContentSpotlight[^>]*file="([^"]+)"[^>]*\/>/g, (_m, file) => {
    const url = file.startsWith('http') ? file : `https://docs.expo.dev/static/videos/${file}`;
    return `[Video: ${file}](${url})`;
  });
}

export function replaceStepSingleQuote(content) {
  return content
    .replace(/<Step\s+label='([^']+)'>/g, 'Step $1: ')
    .replace(/<Step\s+label="([^"]+)">/g, 'Step $1: ')
    .replace(/<\/Step>/g, '');
}

export function replaceIconHeadingSpans(content) {
  return content.replace(
    /<span\s+class(?:Name)?="[^"]*">\s*<\w+Icon\s*\/>\s*([\S\s]*?)<\/span/g,
    '$1'
  );
}

export function stripMultilineImports(content) {
  const parts = content.split(/(```[\S\s]*?```)/);
  for (let i = 0; i < parts.length; i += 2) {
    // Only process non-code-block parts
    // Multiline: import { ... } from '...';
    parts[i] = parts[i].replace(/^import\s+{[^}]*}\s+from\s+["'][^"']+["'];?\s*\n?/gm, '');
    // Single-line: import Foo from '...';
    parts[i] = parts[i].replace(/^import\s+\w+\s+from\s+["']~\/[^"']+["'];?\s*\n?/gm, '');
    // import '...' (side-effect imports from internal paths)
    parts[i] = parts[i].replace(/^import\s+["']~\/[^"']+["'];?\s*\n?/gm, '');
  }
  return parts.join('');
}

export function replaceConfigPluginExample(content) {
  return content.replace(/<ConfigPluginExample>/g, '').replace(/<\/ConfigPluginExample>/g, '');
}

export function replacePermissionComponents(content) {
  let result = content.replace(
    /<AndroidPermissions\s+permissions={\[([^\]]+)]}\s*\/>/g,
    (_m, perms) => {
      const permList = perms
        .replace(/["']/g, '')
        .split(',')
        .map(p => p.trim())
        .filter(Boolean);
      if (permList.length === 0) {
        return '';
      }
      const items = permList.map(p => `- \`android.permission.${p}\``);
      return `Android permissions:\n${items.join('\n')}`;
    }
  );
  result = result.replace(/<IOSPermissions\s+permissions={\[([^\]]+)]}\s*\/>/g, (_m, perms) => {
    const permList = perms
      .replace(/["']/g, '')
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);
    if (permList.length === 0) {
      return '';
    }
    const items = permList.map(p => `- \`${p}\``);
    return `iOS Info.plist keys:\n${items.join('\n')}`;
  });
  return result;
}

export function replaceApiBoxSectionHeader(content) {
  return content.replace(
    /<APIBoxSectionHeader\s+text="([^"]+)"\s*\/>/g,
    (_m, text) => `#### ${text}`
  );
}

export function replaceCalloutBlocks(content) {
  content = content.replace(/<CALLOUT[^>]*\/>/g, '');
  content = content.replace(/<CALLOUT[^>]*>([\S\s]*?)<\/CALLOUT>/g, (_m, inner) => {
    let text = inner;
    text = text.replace(/<A\s+href="([^"]*)"[^>]*>([\S\s]*?)<\/A>/g, '[$2]($1)');
    text = text.replace(/<code>([\S\s]*?)<\/code>/g, '`$1`');
    text = text.replace(/<[^>]+>/g, '');
    text = text.replace(/\s+/g, ' ').trim();
    return text ? `*${text}*` : '';
  });
  return content;
}

export function stripInlineIcons(content) {
  return content.replace(/<CornerDownRightIcon[^>]*\/>/g, '');
}

export function replaceContentSpotlightVideoId(content) {
  return content.replace(
    /<ContentSpotlight\s+videoId="([^"]+)"\s*\/>/g,
    (_m, videoId) => `[Video](https://www.youtube.com/watch?v=${videoId})`
  );
}

export function replaceCollapsibleSpacedSummary(content) {
  return content.replace(
    /<Collapsible\s+summary\s*=\s*"([^"]+)"[^>]*>/g,
    (_m, text) => `**${text.trim()}**\n\n`
  );
}

export function replacePlatformTagsWithClass(content) {
  return content.replace(/<PlatformTag\s+platform="([^"]+)"[^>]*\/>/g, (_m, platform) => {
    const label = platform.charAt(0).toUpperCase() + platform.slice(1);
    return `**${label}**`;
  });
}

export function stripDataDisplayComponents(content) {
  return content
    .replace(/<MONOSPACE>([\S\s]*?)<\/MONOSPACE>/g, '`$1`')
    .replace(/<NUMBER>([\S\s]*?)<\/NUMBER>/g, '$1')
    .replace(/<Project>([\S\s]*?)<\/Project>/g, '$1');
}

export function stripHeaderNestingLevel(content) {
  return content.replace(/\s*headerNestingLevel={\d+}/g, '');
}
