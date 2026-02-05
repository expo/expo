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

function getExamples(comment) {
  if (!comment?.blockTags) {
    return [];
  }
  return comment.blockTags
    .filter(t => t.tag === '@example')
    .map(t => {
      return t.content
        ?.map(part => {
          if (part.kind === 'code') {
            return part.text || '';
          }
          if (part.kind === 'text') {
            return part.text || '';
          }
          return '';
        })
        .join('')
        .trim();
    })
    .filter(Boolean);
}

function getSeeLinks(comment) {
  if (!comment?.blockTags) {
    return [];
  }
  return comment.blockTags
    .filter(t => t.tag === '@see')
    .map(t => {
      return t.content
        ?.map(part => part.text || '')
        .join('')
        .trim();
    })
    .filter(Boolean);
}

function getSince(comment) {
  if (!comment?.blockTags) {
    return '';
  }
  const since = comment.blockTags.find(t => t.tag === '@since');
  if (!since?.content) {
    return '';
  }
  return since.content
    .map(part => part.text || '')
    .join('')
    .trim();
}

function getDeprecatedMessage(comment) {
  if (!comment?.blockTags) {
    return '';
  }
  const deprecated = comment.blockTags.find(t => t.tag === '@deprecated');
  if (!deprecated?.content) {
    return '';
  }
  return deprecated.content
    .map(part => part.text || '')
    .join('')
    .trim();
}

function formatTypeParameters(typeParameters) {
  if (!typeParameters?.length) {
    return '';
  }
  const params = typeParameters.map(tp => {
    let param = tp.name;
    if (tp.type) {
      param += ` extends ${resolveType(tp.type)}`;
    }
    if (tp.default) {
      param += ` = ${resolveType(tp.default)}`;
    }
    return param;
  });
  return `<${params.join(', ')}>`;
}

function formatExtendedTypes(extendedTypes) {
  if (!extendedTypes?.length) {
    return '';
  }
  return extendedTypes.map(t => resolveType(t)).join(', ');
}

function renderProperty(prop) {
  const parts = [];
  const typeStr = resolveType(prop.type);
  const platforms = getPlatforms(prop.comment);
  const since = getSince(prop.comment);
  const deprecatedMsg = getDeprecatedMessage(prop.comment);
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
  if (since) {
    header += ` — *Since: ${since}*`;
  }
  parts.push(header);

  if (deprecatedMsg) {
    parts.push(`> **Deprecated:** ${deprecatedMsg}`);
  }

  const desc = getCommentText(prop.comment);
  if (desc) {
    parts.push(desc);
  }

  const seeLinks = getSeeLinks(prop.comment);
  if (seeLinks.length > 0) {
    parts.push(`See: ${seeLinks.join(', ')}`);
  }

  const examples = getExamples(prop.comment);
  if (examples.length > 0) {
    for (const example of examples) {
      parts.push(example);
    }
  }

  return parts.join('\n\n');
}

function renderAccessor(accessor) {
  const parts = [];
  const getSig = accessor.getSignature;
  const setSig = accessor.setSignature;

  // Determine type from getter return type or setter parameter type
  let typeStr = '';
  if (getSig?.type) {
    typeStr = resolveType(getSig.type);
  } else if (setSig?.parameters?.[0]?.type) {
    typeStr = resolveType(setSig.parameters[0].type);
  }

  // Get comment from getter or setter
  const comment = getSig?.comment || setSig?.comment || accessor.comment;
  const platforms = getPlatforms(comment);
  const since = getSince(comment);
  const deprecatedMsg = getDeprecatedMessage(comment);

  const flags = [];
  if (getSig && !setSig) {
    flags.push('Read Only');
  } else if (setSig && !getSig) {
    flags.push('Write Only');
  }
  if (accessor.flags?.isStatic) {
    flags.push('Static');
  }

  let header = `**\`${accessor.name}\`**`;
  if (typeStr) {
    header += ` — Type: \`${typeStr}\``;
  }
  if (flags.length > 0) {
    header += ` — *${flags.join(', ')}*`;
  }
  if (platforms.length > 0) {
    header += ` — *${platforms.join(', ')}*`;
  }
  if (since) {
    header += ` — *Since: ${since}*`;
  }
  parts.push(header);

  if (deprecatedMsg) {
    parts.push(`> **Deprecated:** ${deprecatedMsg}`);
  }

  const desc = getCommentText(comment);
  if (desc) {
    parts.push(desc);
  }

  const seeLinks = getSeeLinks(comment);
  if (seeLinks.length > 0) {
    parts.push(`See: ${seeLinks.join(', ')}`);
  }

  const examples = getExamples(comment);
  if (examples.length > 0) {
    for (const example of examples) {
      parts.push(example);
    }
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
  const since = getSince(sig.comment);
  const deprecatedMsg = getDeprecatedMessage(sig.comment);

  let header = `**\`${isStatic ? 'static ' : ''}${sig.name || methodName}(${params})\`**`;
  if (returnType) {
    header += ` — Returns: \`${returnType}\``;
  }
  const tags = [...modifiers, ...platforms];
  if (tags.length > 0) {
    header += ` — *${tags.join(', ')}*`;
  }
  if (since) {
    header += ` — *Since: ${since}*`;
  }
  parts.push(header);

  if (deprecatedMsg) {
    parts.push(`> **Deprecated:** ${deprecatedMsg}`);
  }

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

  const seeLinks = getSeeLinks(sig.comment);
  if (seeLinks.length > 0) {
    parts.push(`See: ${seeLinks.join(', ')}`);
  }

  const examples = getExamples(sig.comment);
  if (examples.length > 0) {
    for (const example of examples) {
      parts.push(example);
    }
  }

  return parts.join('\n\n');
}

function isReactComponent(entry) {
  // Check if a kind 32 entry is a React component
  // Components have a type with reflection that has signatures with a "props" parameter
  const type = entry.type;
  if (!type) {
    return false;
  }

  // Check intersection types (common for forwardRef components)
  if (type.type === 'intersection' && type.types) {
    for (const t of type.types) {
      if (t.type === 'reflection' && t.declaration?.signatures?.length > 0) {
        const sig = t.declaration.signatures[0];
        const hasPropsParam = sig.parameters?.some(p => p.name === 'props');
        if (hasPropsParam) {
          return true;
        }
      }
    }
  }

  // Check direct reflection type
  if (type.type === 'reflection' && type.declaration?.signatures?.length > 0) {
    const sig = type.declaration.signatures[0];
    const hasPropsParam = sig.parameters?.some(p => p.name === 'props');
    if (hasPropsParam) {
      return true;
    }
  }

  return false;
}

function getComponentSignature(entry) {
  // Get the signature from a component entry
  const type = entry.type;
  if (!type) {
    return null;
  }

  if (type.type === 'intersection' && type.types) {
    for (const t of type.types) {
      if (t.type === 'reflection' && t.declaration?.signatures?.length > 0) {
        return t.declaration.signatures[0];
      }
    }
  }

  if (type.type === 'reflection' && type.declaration?.signatures?.length > 0) {
    return type.declaration.signatures[0];
  }

  return null;
}

function renderComponent(entry) {
  const parts = [];
  const sig = getComponentSignature(entry);
  const description = sig ? getCommentText(sig.comment) : getCommentText(entry.comment);
  const platforms = sig ? getPlatforms(sig.comment) : getPlatforms(entry.comment);
  const modifiers = sig ? getModifierTags(sig.comment) : getModifierTags(entry.comment);

  // Use backtick escaping to avoid collision with JSX cleanup in utils.js
  let header = `**\`${entry.name}\`** (*Component*)`;
  const tags = [...modifiers, ...platforms];
  if (tags.length > 0) {
    header += ` — *${tags.join(', ')}*`;
  }
  parts.push(header);

  if (description) {
    parts.push(description);
  }

  // Render props if available
  if (sig?.parameters?.length > 0) {
    const propsParam = sig.parameters.find(p => p.name === 'props');
    if (propsParam?.type) {
      const propsType = propsParam.type;
      // If props is a reference to a named type, just mention it
      if (propsType.type === 'reference' && propsType.name) {
        parts.push(`Props: See [\`${propsType.name}\`](#${propsType.name.toLowerCase()})`);
      }
    }
  }

  // Render examples if available
  const examples = sig ? getExamples(sig.comment) : getExamples(entry.comment);
  if (examples.length > 0) {
    for (const example of examples) {
      parts.push(example);
    }
  }

  return parts.join('\n\n');
}

function renderApiChildren(children) {
  const lines = [];

  // Group children by kind
  const allFunctions = children.filter(c => c.kind === 64 && c.name && c.name !== 'default');
  const hooks = allFunctions.filter(c => c.name.startsWith('use'));
  const methods = allFunctions.filter(c => !c.name.startsWith('use'));
  const classes = children.filter(c => c.kind === 128 && c.name && c.name !== 'default');
  const enums = children.filter(c => c.kind === 8 && c.name && c.name !== 'default');
  const interfaces = children.filter(c => c.kind === 256 && c.name && c.name !== 'default');
  const types = children.filter(
    c => (c.kind === 2097152 || c.kind === 4194304) && c.name && c.name !== 'default'
  );
  const allConstants = children.filter(c => c.kind === 32 && c.name && c.name !== 'default');
  const components = allConstants.filter(isReactComponent);
  const constants = allConstants.filter(c => !isReactComponent(c));
  const moduleAccessors = children.filter(c => c.kind === 262144 && c.name && c.name !== 'default');
  const moduleProperties = children.filter(c => c.kind === 1024 && c.name && c.name !== 'default');

  // Render Hooks first
  if (hooks.length > 0) {
    lines.push('### Hooks');
    for (const entry of hooks) {
      const sigs = entry.signatures || [];
      for (const sig of sigs) {
        lines.push(renderMethodSignature(entry.name, sig));
      }
    }
  }

  // Render Components
  if (components.length > 0) {
    lines.push('### Components');
    for (const entry of components) {
      lines.push(renderComponent(entry));
    }
  }

  // Render Methods
  if (methods.length > 0) {
    lines.push('### Methods');
    for (const entry of methods) {
      const sigs = entry.signatures || [];
      for (const sig of sigs) {
        lines.push(renderMethodSignature(entry.name, sig));
      }
    }
  }

  // Render module-level Properties and Accessors
  if (moduleProperties.length > 0 || moduleAccessors.length > 0) {
    lines.push('### Properties');
    for (const prop of moduleProperties) {
      lines.push(renderProperty(prop));
    }
    for (const accessor of moduleAccessors) {
      lines.push(renderAccessor(accessor));
    }
  }

  // Render Classes
  for (const entry of classes) {
    const description = getCommentText(entry.comment);
    const typeParams = formatTypeParameters(entry.typeParameters);
    const extendsStr = formatExtendedTypes(entry.extendedTypes);

    let classHeader = `### ${entry.name}${typeParams} (*Class*)`;
    if (extendsStr) {
      classHeader += ` extends ${extendsStr}`;
    }
    lines.push(classHeader);

    if (description) {
      lines.push(description);
    }

    const classChildren = entry.children || [];
    const properties = classChildren.filter(c => c.kind === 1024);
    const accessors = classChildren.filter(c => c.kind === 262144);
    const classMethods = classChildren.filter(c => c.kind === 2048);

    if (properties.length > 0 || accessors.length > 0) {
      lines.push(`#### ${entry.name} Properties`);
      for (const prop of properties) {
        lines.push(renderProperty(prop));
      }
      for (const accessor of accessors) {
        lines.push(renderAccessor(accessor));
      }
    }

    if (classMethods.length > 0) {
      lines.push(`#### ${entry.name} Methods`);
      for (const method of classMethods) {
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
      const deprecatedMsg = getDeprecatedMessage(m.comment);
      const since = getSince(m.comment);
      let enumLine = `- **\`${m.name}\`**${val}`;
      if (since) {
        enumLine += ` — *Since: ${since}*`;
      }
      if (deprecatedMsg) {
        enumLine += ` — **Deprecated:** ${deprecatedMsg}`;
      }
      if (mDesc) {
        enumLine += ` — ${mDesc}`;
      }
      lines.push(enumLine);
    }
  }

  // Render Interfaces
  for (const entry of interfaces) {
    const description = getCommentText(entry.comment);
    const typeParams = formatTypeParameters(entry.typeParameters);
    const extendsStr = formatExtendedTypes(entry.extendedTypes);

    let interfaceHeader = `### ${entry.name}${typeParams} (*Interface*)`;
    if (extendsStr) {
      interfaceHeader += ` extends ${extendsStr}`;
    }
    lines.push(interfaceHeader);

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
      const typeParams = formatTypeParameters(entry.typeParameters);
      const deprecatedMsg = getDeprecatedMessage(entry.comment);

      let typeHeader = `#### ${entry.name}${typeParams}`;
      if (platforms.length > 0) {
        typeHeader += ` — *${platforms.join(', ')}*`;
      }
      lines.push(typeHeader);

      if (deprecatedMsg) {
        lines.push(`> **Deprecated:** ${deprecatedMsg}`);
      }

      if (description) {
        lines.push(description);
      }
      const typeStr = resolveType(entry.type);
      if (typeStr && typeStr !== 'object') {
        lines.push(`Type: \`${typeStr}\``);
      }
      // Helper to render children (properties and accessors)
      const renderChildren = childrenArray => {
        for (const child of childrenArray) {
          if (child.kind === 1024) {
            lines.push(renderProperty(child));
          } else if (child.kind === 262144) {
            lines.push(renderAccessor(child));
          }
        }
      };

      // If the entry has direct children (properties), render them
      if (entry.children?.length) {
        renderChildren(entry.children);
      }
      // If the type is a reflection with children (object type), render its properties
      else if (entry.type?.type === 'reflection' && entry.type.declaration?.children?.length) {
        renderChildren(entry.type.declaration.children);
      }
      // If it's an intersection with a reflection, render the reflection's properties
      else if (entry.type?.type === 'intersection') {
        for (const t of entry.type.types || []) {
          if (t.type === 'reflection' && t.declaration?.children?.length) {
            renderChildren(t.declaration.children);
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
    // Render nested properties/accessors if the constant has a reflection type
    if (entry.type?.type === 'reflection' && entry.type.declaration?.children?.length) {
      for (const child of entry.type.declaration.children) {
        if (child.kind === 1024) {
          lines.push(renderProperty(child));
        } else if (child.kind === 262144) {
          lines.push(renderAccessor(child));
        }
      }
    }
  }

  return lines.join('\n\n');
}
