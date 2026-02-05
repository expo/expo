import fs from 'node:fs';
import path from 'node:path';

import { extractAttribute } from './shared-utils.js';

export function generateApiSectionMarkdown(attributeString, pagePath) {
  const packageName = extractAttribute(attributeString, 'packageName');
  if (!packageName) {
    return '';
  }

  const packages = packageName.includes(',')
    ? packageName.split(',').map(s => s.trim().replace(/["']/g, ''))
    : [packageName.replace(/["']/g, '')];

  const versionsPath = path.join(process.cwd(), 'public/static/constants/versions.json');
  let latestVersion = 'latest';
  if (fs.existsSync(versionsPath)) {
    try {
      const v = JSON.parse(fs.readFileSync(versionsPath, 'utf-8'));
      latestVersion = v.LATEST_VERSION || 'latest';
    } catch {
      /* ignore */
    }
  }

  let version = latestVersion;
  if (pagePath) {
    const m = pagePath.match(/\/versions\/(v[\d.]+|latest|unversioned)\//);
    if (m) {
      version = m[1] === 'latest' ? latestVersion : m[1];
    }
  }

  const forceVersion = extractAttribute(attributeString, 'forceVersion');
  if (forceVersion) {
    version = forceVersion === 'latest' ? latestVersion : forceVersion;
  }

  const sections = [];
  for (const pkg of packages) {
    const dataPath = path.join(process.cwd(), `public/static/data/${version}/${pkg}.json`);
    if (!fs.existsSync(dataPath)) {
      continue;
    }
    try {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      const children = data?.children;
      if (!Array.isArray(children) || children.length === 0) {
        continue;
      }
      const rendered = renderApiChildren(children);
      if (rendered) {
        sections.push(rendered);
      }
    } catch {
      /* ignore */
    }
  }

  if (sections.length === 0) {
    return '';
  }
  return `## API: ${packageName}\n\n${sections.join('\n\n')}`;
}

function resolveType(type) {
  if (!type) {
    return '';
  }
  switch (type.type) {
    case 'intrinsic':
    case 'literal':
      if (type.type === 'literal') {
        if (type.value === null) {
          return 'null';
        }
        if (typeof type.value === 'string') {
          return `'${type.value}'`;
        }
        return String(type.value);
      }
      return type.name || '';
    case 'reference':
      if (type.typeArguments?.length) {
        const args = type.typeArguments.map(resolveType).join(', ');
        return `${type.name}<${args}>`;
      }
      return type.name || '';
    case 'union':
      return (type.types || []).map(resolveType).filter(Boolean).join(' | ');
    case 'intersection':
      return (type.types || []).map(resolveType).filter(Boolean).join(' & ');
    case 'array':
      return `${resolveType(type.elementType)}[]`;
    case 'tuple':
      return `[${(type.elements || []).map(resolveType).join(', ')}]`;
    case 'reflection': {
      const decl = type.declaration;
      if (!decl) {
        return 'object';
      }
      if (decl.signatures?.length) {
        const sig = decl.signatures[0];
        const params = (sig.parameters || [])
          .map(p => `${p.name}: ${resolveType(p.type)}`)
          .join(', ');
        return `(${params}) => ${resolveType(sig.type)}`;
      }
      if (decl.children?.length) {
        const props = decl.children.map(c => `${c.name}: ${resolveType(c.type)}`);
        if (props.length <= 3) {
          return `{ ${props.join(', ')} }`;
        }
        return 'object';
      }
      return 'object';
    }
    case 'indexedAccess':
      return `${resolveType(type.objectType)}[${resolveType(type.indexType)}]`;
    case 'mapped':
      return 'object';
    case 'templateLiteral':
      return 'string';
    case 'typeOperator':
      return `${type.operator} ${resolveType(type.target)}`;
    default:
      return type.name || '';
  }
}

function getCommentText(comment) {
  if (!comment?.summary || !Array.isArray(comment.summary)) {
    return '';
  }
  return comment.summary
    .map(part => {
      if (part.kind === 'text') {
        return part.text || '';
      }
      if (part.kind === 'code') {
        return part.text || '';
      }
      if (part.kind === 'inline-tag' && part.tag === '@link') {
        return part.text || '';
      }
      return '';
    })
    .join('')
    .trim();
}

function getReturnComment(comment) {
  if (!comment?.blockTags) {
    return '';
  }
  const ret = comment.blockTags.find(t => t.tag === '@returns' || t.tag === '@return');
  if (!ret?.content) {
    return '';
  }
  return ret.content
    .map(part => {
      if (part.kind === 'text') {
        return part.text || '';
      }
      if (part.kind === 'code') {
        return part.text || '';
      }
      return '';
    })
    .join('')
    .trim();
}

function getPlatforms(comment) {
  if (!comment?.blockTags) {
    return [];
  }
  return comment.blockTags
    .filter(t => t.tag === '@platform')
    .map(t => {
      const text = t.content?.map(c => c.text || '').join('') || '';
      // Capitalize platform names properly
      if (text.toLowerCase().startsWith('ios')) {
        return 'iOS' + text.slice(3);
      }
      if (text.toLowerCase().startsWith('android')) {
        return 'Android' + text.slice(7);
      }
      if (text.toLowerCase().startsWith('web')) {
        return 'Web' + text.slice(3);
      }
      return text;
    })
    .filter(Boolean);
}

function getModifierTags(comment) {
  const tags = [];
  if (comment?.modifierTags?.includes('@experimental')) {
    tags.push('Experimental');
  }
  if (comment?.modifierTags?.includes('@deprecated')) {
    tags.push('Deprecated');
  }
  return tags;
}

function renderProperty(prop) {
  const parts = [];
  const typeStr = resolveType(prop.type);
  const platforms = getPlatforms(prop.comment);
  const flags = [];
  if (prop.flags?.isOptional) {
    flags.push('Optional');
  }
  if (prop.flags?.isReadonly) {
    flags.push('Read Only');
  }
  if (prop.flags?.isStatic) {
    flags.push('Static');
  }

  let header = `**\`${prop.name}\`**`;
  if (typeStr) {
    header += ` — Type: \`${typeStr}\``;
  }
  if (prop.defaultValue !== null) {
    header += ` — Default: \`${prop.defaultValue}\``;
  }
  if (flags.length > 0) {
    header += ` — *${flags.join(', ')}*`;
  }
  if (platforms.length > 0) {
    header += ` — *${platforms.join(', ')}*`;
  }
  parts.push(header);

  const desc = getCommentText(prop.comment);
  if (desc) {
    parts.push(desc);
  }

  return parts.join('\n\n');
}

function renderMethodSignature(methodName, sig) {
  const parts = [];
  const params = (sig.parameters || []).map(p => p.name).join(', ');
  const returnType = resolveType(sig.type);
  const isStatic = sig.flags?.isStatic;
  const platforms = getPlatforms(sig.comment);
  const modifiers = getModifierTags(sig.comment);

  let header = `**\`${isStatic ? 'static ' : ''}${sig.name || methodName}(${params})\`**`;
  if (returnType) {
    header += ` — Returns: \`${returnType}\``;
  }
  const tags = [...modifiers, ...platforms];
  if (tags.length > 0) {
    header += ` — *${tags.join(', ')}*`;
  }
  parts.push(header);

  const desc = getCommentText(sig.comment);
  if (desc) {
    parts.push(desc);
  }

  const sigParams = sig.parameters || [];
  if (sigParams.length > 0) {
    const paramLines = sigParams.map(p => {
      const pType = resolveType(p.type);
      const pDesc = getCommentText(p.comment);
      let line = `- \`${p.name}\``;
      if (pType) {
        line += ` (\`${pType}\`)`;
      }
      if (pDesc) {
        line += ` — ${pDesc}`;
      }
      return line;
    });
    parts.push(paramLines.join('\n'));
  }

  const retComment = getReturnComment(sig.comment);
  if (retComment) {
    parts.push(`Returns: ${retComment}`);
  }

  return parts.join('\n\n');
}

function renderApiChildren(children) {
  const lines = [];

  // Group children by kind
  const functions = children.filter(c => c.kind === 64 && c.name && c.name !== 'default');
  const classes = children.filter(c => c.kind === 128 && c.name && c.name !== 'default');
  const enums = children.filter(c => c.kind === 8 && c.name && c.name !== 'default');
  const interfaces = children.filter(c => c.kind === 256 && c.name && c.name !== 'default');
  const types = children.filter(
    c => (c.kind === 2097152 || c.kind === 4194304) && c.name && c.name !== 'default'
  );
  const constants = children.filter(c => c.kind === 32 && c.name && c.name !== 'default');

  // Render Methods/Functions first
  if (functions.length > 0) {
    lines.push('### Methods');
    for (const entry of functions) {
      const sigs = entry.signatures || [];
      for (const sig of sigs) {
        lines.push(renderMethodSignature(entry.name, sig));
      }
    }
  }

  // Render Classes
  for (const entry of classes) {
    const description = getCommentText(entry.comment);
    lines.push(`### ${entry.name} (*Class*)`);
    if (description) {
      lines.push(description);
    }

    const classChildren = entry.children || [];
    const properties = classChildren.filter(c => c.kind === 1024);
    const methods = classChildren.filter(c => c.kind === 2048);

    if (properties.length > 0) {
      lines.push(`#### ${entry.name} Properties`);
      for (const prop of properties) {
        lines.push(renderProperty(prop));
      }
    }

    if (methods.length > 0) {
      lines.push(`#### ${entry.name} Methods`);
      for (const method of methods) {
        const sigs = method.signatures || [];
        for (const sig of sigs) {
          lines.push(renderMethodSignature(method.name, { ...sig, flags: method.flags }));
        }
      }
    }
  }

  // Render Enums
  for (const entry of enums) {
    const description = getCommentText(entry.comment);
    lines.push(`### ${entry.name} (*Enum*)`);
    if (description) {
      lines.push(description);
    }
    const members = entry.children || [];
    for (const m of members) {
      const val = m.defaultValue ? ` = \`${m.defaultValue}\`` : '';
      const mDesc = getCommentText(m.comment);
      lines.push(`- **\`${m.name}\`**${val}${mDesc ? ` — ${mDesc}` : ''}`);
    }
  }

  // Render Interfaces
  for (const entry of interfaces) {
    const description = getCommentText(entry.comment);
    lines.push(`### ${entry.name} (*Interface*)`);
    if (description) {
      lines.push(description);
    }
    const props = (entry.children || []).filter(c => c.kind === 1024);
    if (props.length > 0) {
      for (const prop of props) {
        lines.push(renderProperty(prop));
      }
    }
  }

  // Render Types
  if (types.length > 0) {
    lines.push('### Types');
    for (const entry of types) {
      const description = getCommentText(entry.comment);
      const platforms = getPlatforms(entry.comment);
      let typeHeader = `#### ${entry.name}`;
      if (platforms.length > 0) {
        typeHeader += ` — *${platforms.join(', ')}*`;
      }
      lines.push(typeHeader);
      if (description) {
        lines.push(description);
      }
      const typeStr = resolveType(entry.type);
      if (typeStr && typeStr !== 'object') {
        lines.push(`Type: \`${typeStr}\``);
      }
      // If the entry has direct children (properties), render them
      if (entry.children?.length) {
        for (const prop of entry.children) {
          lines.push(renderProperty(prop));
        }
      }
      // If the type is a reflection with children (object type), render its properties
      else if (entry.type?.type === 'reflection' && entry.type.declaration?.children?.length) {
        for (const prop of entry.type.declaration.children) {
          lines.push(renderProperty(prop));
        }
      }
      // If it's an intersection with a reflection, render the reflection's properties
      else if (entry.type?.type === 'intersection') {
        for (const t of entry.type.types || []) {
          if (t.type === 'reflection' && t.declaration?.children?.length) {
            for (const prop of t.declaration.children) {
              lines.push(renderProperty(prop));
            }
          }
        }
      }
    }
  }

  // Render Constants
  for (const entry of constants) {
    const description = getCommentText(entry.comment);
    const valStr = entry.defaultValue ? ` = \`${entry.defaultValue}\`` : '';
    lines.push(`### ${entry.name} (*Constant*)${valStr}`);
    if (description) {
      lines.push(description);
    }
  }

  return lines.join('\n\n');
}
