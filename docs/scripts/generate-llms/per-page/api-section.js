import fs from 'node:fs';
import path from 'node:path';

import { extractAttribute } from './shared-utils.js';

export function generateApiSectionMarkdown(attributeString, pagePath) {
  const packageName = extractAttribute(attributeString, 'packageName');
  if (!packageName) return '';

  const packages = packageName.includes(',')
    ? packageName.split(',').map(s => s.trim().replace(/['"]/g, ''))
    : [packageName.replace(/['"]/g, '')];

  const versionsPath = path.join(process.cwd(), 'public/static/constants/versions.json');
  let latestVersion = 'latest';
  if (fs.existsSync(versionsPath)) {
    try {
      const v = JSON.parse(fs.readFileSync(versionsPath, 'utf-8'));
      latestVersion = v.LATEST_VERSION || 'latest';
    } catch { /* ignore */ }
  }

  let version = latestVersion;
  if (pagePath) {
    const m = pagePath.match(/\/versions\/(v[\d.]+|latest|unversioned)\//);
    if (m) version = m[1] === 'latest' ? latestVersion : m[1];
  }

  const forceVersion = extractAttribute(attributeString, 'forceVersion');
  if (forceVersion) version = forceVersion === 'latest' ? latestVersion : forceVersion;

  const sections = [];
  for (const pkg of packages) {
    const dataPath = path.join(process.cwd(), `public/static/data/${version}/${pkg}.json`);
    if (!fs.existsSync(dataPath)) continue;
    try {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      const children = data?.children;
      if (!Array.isArray(children) || children.length === 0) continue;
      const rendered = renderApiChildren(children);
      if (rendered) sections.push(rendered);
    } catch { /* ignore */ }
  }

  if (sections.length === 0) return '';
  return `## API: ${packageName}\n\n${sections.join('\n\n')}`;
}

// ---------------------------------------------------------------------------
// Type resolution — converts TypeDoc type objects to readable strings
// ---------------------------------------------------------------------------

function resolveType(type) {
  if (!type) return '';
  switch (type.type) {
    case 'intrinsic':
    case 'literal':
      if (type.type === 'literal') {
        if (type.value === null) return 'null';
        if (typeof type.value === 'string') return `'${type.value}'`;
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
      if (!decl) return 'object';
      // Function signature
      if (decl.signatures?.length) {
        const sig = decl.signatures[0];
        const params = (sig.parameters || [])
          .map(p => `${p.name}: ${resolveType(p.type)}`)
          .join(', ');
        return `(${params}) => ${resolveType(sig.type)}`;
      }
      // Object type
      if (decl.children?.length) {
        const props = decl.children.map(c => `${c.name}: ${resolveType(c.type)}`);
        if (props.length <= 3) return `{ ${props.join(', ')} }`;
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

// ---------------------------------------------------------------------------
// Comment extraction
// ---------------------------------------------------------------------------

function getCommentText(comment) {
  if (!comment?.summary || !Array.isArray(comment.summary)) return '';
  return comment.summary
    .map(part => {
      if (part.kind === 'text') return part.text || '';
      if (part.kind === 'code') return part.text || '';
      if (part.kind === 'inline-tag' && part.tag === '@link') return part.text || '';
      return '';
    })
    .join('')
    .trim();
}

function getReturnComment(comment) {
  if (!comment?.blockTags) return '';
  const ret = comment.blockTags.find(t => t.tag === '@returns' || t.tag === '@return');
  if (!ret?.content) return '';
  return ret.content
    .map(part => {
      if (part.kind === 'text') return part.text || '';
      if (part.kind === 'code') return part.text || '';
      return '';
    })
    .join('')
    .trim();
}

// ---------------------------------------------------------------------------
// Property/field rendering (used for classes, interfaces, type alias objects)
// ---------------------------------------------------------------------------

function renderProperty(prop) {
  const parts = [];
  const typeStr = resolveType(prop.type);
  const flags = [];
  if (prop.flags?.isOptional) flags.push('Optional');
  if (prop.flags?.isReadonly) flags.push('Read Only');
  if (prop.flags?.isStatic) flags.push('Static');

  let header = `**\`${prop.name}\`**`;
  if (typeStr) header += ` — Type: \`${typeStr}\``;
  if (prop.defaultValue != null) header += ` — Default: \`${prop.defaultValue}\``;
  if (flags.length) header += ` — *${flags.join(', ')}*`;
  parts.push(header);

  const desc = getCommentText(prop.comment);
  if (desc) parts.push(desc);

  return parts.join('\n\n');
}

function renderMethodSignature(methodName, sig) {
  const parts = [];
  const params = (sig.parameters || []).map(p => p.name).join(', ');
  const returnType = resolveType(sig.type);
  const isStatic = sig.flags?.isStatic;

  let header = `**\`${isStatic ? 'static ' : ''}${sig.name || methodName}(${params})\`**`;
  if (returnType) header += ` — Returns: \`${returnType}\``;
  parts.push(header);

  const desc = getCommentText(sig.comment);
  if (desc) parts.push(desc);

  // Parameter details
  const sigParams = sig.parameters || [];
  if (sigParams.length > 0) {
    const paramLines = sigParams.map(p => {
      const pType = resolveType(p.type);
      const pDesc = getCommentText(p.comment);
      let line = `- \`${p.name}\``;
      if (pType) line += ` (\`${pType}\`)`;
      if (pDesc) line += ` — ${pDesc}`;
      return line;
    });
    parts.push(paramLines.join('\n'));
  }

  const retComment = getReturnComment(sig.comment);
  if (retComment) parts.push(`Returns: ${retComment}`);

  return parts.join('\n\n');
}

// ---------------------------------------------------------------------------
// Main renderer — iterates top-level TypeDoc children
// ---------------------------------------------------------------------------

function renderApiChildren(children) {
  const lines = [];
  for (const entry of children) {
    if (!entry?.name || entry.name === 'default') continue;
    const kind = entry.kind;
    const description = getCommentText(entry.comment);

    // Functions/hooks (64)
    if (kind === 64) {
      const sigs = entry.signatures || [];
      for (const sig of sigs) {
        lines.push(renderMethodSignature(entry.name, sig));
      }
      continue;
    }

    // Classes (128)
    if (kind === 128) {
      lines.push(`### ${entry.name} (*Class*)`);
      if (description) lines.push(description);

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
      continue;
    }

    // Enums (8)
    if (kind === 8) {
      lines.push(`### ${entry.name} (*Enum*)`);
      if (description) lines.push(description);
      const members = entry.children || [];
      for (const m of members) {
        const val = m.defaultValue ? ` = \`${m.defaultValue}\`` : '';
        const mDesc = getCommentText(m.comment);
        lines.push(`- **\`${m.name}\`**${val}${mDesc ? ` — ${mDesc}` : ''}`);
      }
      continue;
    }

    // Interfaces (256)
    if (kind === 256) {
      lines.push(`### ${entry.name} (*Interface*)`);
      if (description) lines.push(description);
      const props = (entry.children || []).filter(c => c.kind === 1024);
      if (props.length > 0) {
        for (const prop of props) {
          lines.push(renderProperty(prop));
        }
      }
      continue;
    }

    // Type aliases (2097152 / 4194304)
    if (kind === 2097152 || kind === 4194304) {
      lines.push(`### ${entry.name} (*Type*)`);
      if (description) lines.push(description);
      const typeStr = resolveType(entry.type);
      if (typeStr && typeStr !== 'object') {
        lines.push(`Type: \`${typeStr}\``);
      }
      // If the type is a reflection with children (object type), render its properties
      if (entry.type?.type === 'reflection' && entry.type.declaration?.children?.length) {
        for (const prop of entry.type.declaration.children) {
          lines.push(renderProperty(prop));
        }
      }
      // If it's an intersection with a reflection, render the reflection's properties
      if (entry.type?.type === 'intersection') {
        for (const t of entry.type.types || []) {
          if (t.type === 'reflection' && t.declaration?.children?.length) {
            for (const prop of t.declaration.children) {
              lines.push(renderProperty(prop));
            }
          }
        }
      }
      continue;
    }

    // Variables/constants (32)
    if (kind === 32) {
      const valStr = entry.defaultValue ? ` = \`${entry.defaultValue}\`` : '';
      lines.push(`### ${entry.name} (*Constant*)${valStr}`);
      if (description) lines.push(description);
      continue;
    }
  }
  return lines.join('\n\n');
}
