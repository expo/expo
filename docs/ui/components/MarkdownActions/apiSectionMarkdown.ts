import {
  CommentData,
  GeneratedData,
  MethodDefinitionData,
  MethodSignatureData,
  MethodParamData,
  TypeDefinitionData,
  TypeDocKind,
} from '~/components/plugins/api/APIDataTypes';
import { getAllTagData, getCommentContent } from '~/components/plugins/api/APISectionUtils';
import versions from '~/public/static/constants/versions.json';

const { LATEST_VERSION } = versions;

export type ApiSectionOptions = {
  packageName?: string | string[];
  apiName?: string;
  forceVersion?: string;
  headersMapping?: Record<string, string>;
};

export type ApiMarkdownContext = {
  path?: string;
};

type ApiDataFile = {
  children?: GeneratedData[];
};

const HOOK_EXCEPTIONS = new Set(['useSystemBrightnessAsync']);
const METHOD_HEADER_TAG = '@header';

type CategorizedEntries = {
  classes: GeneratedData[];
  hooks: GeneratedData[];
  methods: GeneratedData[];
  categorizedMethods: Map<string, GeneratedData[]>;
  eventSubscriptions: GeneratedData[];
  typeAliases: GeneratedData[];
  props: GeneratedData[];
  interfaces: GeneratedData[];
  constants: GeneratedData[];
  enums: GeneratedData[];
  namespaces: GeneratedData[];
};

export async function generateApiSectionMarkdownAsync(
  options: ApiSectionOptions,
  context: ApiMarkdownContext
) {
  const packages = normalizePackageNames(options.packageName);
  if (packages.length === 0) {
    return '';
  }

  const version = resolveVersion(options.forceVersion, context.path);
  const dataFiles = await Promise.all(packages.map(pkg => fetchPackageDataAsync(version, pkg)));
  const allEntries = dataFiles
    .filter(Boolean)
    .flatMap(file => (file as ApiDataFile).children ?? [])
    .filter(Boolean);

  if (allEntries.length === 0) {
    return '';
  }

  const {
    classes,
    hooks,
    methods,
    categorizedMethods,
    eventSubscriptions,
    typeAliases,
    props,
    interfaces,
    constants,
    enums,
    namespaces,
  } = categorizeEntries(allEntries, options.headersMapping);

  const sections: string[] = [];

  const classSection = renderEntries(classes, version, 3);
  if (classSection) {
    sections.push(classSection);
  }

  const categorizedSections = renderCategorizedMethodSections(
    categorizedMethods,
    version,
    options.headersMapping
  );
  sections.push(...categorizedSections);

  const hooksSection = renderGroupedSection('Hooks', hooks, version);
  if (hooksSection) {
    sections.push(hooksSection);
  }

  const methodsLabel = options.apiName ? `${options.apiName} Methods` : 'Methods';
  const methodsSection = renderGroupedSection(methodsLabel, methods, version);
  if (methodsSection) {
    sections.push(methodsSection);
  }

  const subscriptionsSection = renderGroupedSection(
    'Event Subscriptions',
    eventSubscriptions,
    version
  );
  if (subscriptionsSection) {
    sections.push(subscriptionsSection);
  }

  const propsSection = renderGroupedSection('Props', props, version);
  if (propsSection) {
    sections.push(propsSection);
  }

  const interfacesSection = renderGroupedSection('Interfaces', interfaces, version);
  if (interfacesSection) {
    sections.push(interfacesSection);
  }

  const typesSection = renderGroupedSection('Types', typeAliases, version);
  if (typesSection) {
    sections.push(typesSection);
  }

  const constantsSection = renderGroupedSection('Constants', constants, version);
  if (constantsSection) {
    sections.push(constantsSection);
  }

  const enumsSection = renderGroupedSection('Enums', enums, version);
  if (enumsSection) {
    sections.push(enumsSection);
  }

  const namespacesSection = renderGroupedSection('Namespaces', namespaces, version);
  if (namespacesSection) {
    sections.push(namespacesSection);
  }

  const content = sections.filter(Boolean).join('\n\n');

  if (!content) {
    return '';
  }

  const headingTitle = Array.isArray(options.packageName)
    ? options.packageName.join(', ')
    : (options.packageName ?? 'API');

  return `## API: ${headingTitle}\n\n${content}`;
}

function categorizeEntries(
  entries: GeneratedData[],
  headersMapping: Record<string, string> = {}
): CategorizedEntries {
  const classes: GeneratedData[] = [];
  const hooks: GeneratedData[] = [];
  const methods: GeneratedData[] = [];
  const eventSubscriptions: GeneratedData[] = [];
  const typeAliases: GeneratedData[] = [];
  const props: GeneratedData[] = [];
  const interfaces: GeneratedData[] = [];
  const constants: GeneratedData[] = [];
  const enums: GeneratedData[] = [];
  const namespaces: GeneratedData[] = [];

  const categorizedMethods = new Map<string, GeneratedData[]>();

  entries.forEach(entry => {
    switch (entry.kind) {
      case TypeDocKind.Class:
        if (entry.name !== 'default') {
          classes.push(entry);
        }
        break;
      case TypeDocKind.Function: {
        if (isListener(entry)) {
          eventSubscriptions.push(entry);
          break;
        }

        if (isHook(entry)) {
          hooks.push(entry);
          break;
        }

        const header = getMethodHeader(entry);
        if (header) {
          const label = headersMapping[header] ?? header;
          const existing = categorizedMethods.get(label) ?? [];
          existing.push(entry);
          categorizedMethods.set(label, existing);
        } else {
          methods.push(entry);
        }
        break;
      }
      case TypeDocKind.Interface:
        if (isProp(entry)) {
          props.push(entry);
        } else {
          interfaces.push(entry);
        }
        break;
      case TypeDocKind.TypeAlias:
      case TypeDocKind.TypeAlias_Legacy:
        if (isProp(entry)) {
          props.push(entry);
        } else if (isValidTypeAlias(entry)) {
          typeAliases.push(entry);
        }
        break;
      case TypeDocKind.Variable:
        if (isConstant(entry)) {
          constants.push(entry);
        }
        break;
      case TypeDocKind.Enum:
        if (entry.name !== 'default') {
          enums.push(entry);
        }
        break;
      case TypeDocKind.Namespace:
        namespaces.push(entry);
        break;
      default:
        break;
    }
  });

  return {
    classes,
    hooks,
    methods,
    categorizedMethods,
    eventSubscriptions,
    typeAliases,
    props,
    interfaces,
    constants,
    enums,
    namespaces,
  };
}

function renderCategorizedMethodSections(
  groups: Map<string, GeneratedData[]>,
  version: string,
  headersMapping: Record<string, string> = {}
) {
  if (groups.size === 0) {
    return [] as string[];
  }

  const rendered: string[] = [];
  const handled = new Set<string>();

  Object.entries(headersMapping).forEach(([original, label]) => {
    const targetKey = groups.has(label) ? label : original;
    const entries = groups.get(targetKey);
    if (!entries || entries.length === 0) {
      return;
    }
    const section = renderGroupedSection(label, entries, version);
    if (section) {
      rendered.push(section);
      handled.add(targetKey);
    }
  });

  groups.forEach((entries, label) => {
    if (handled.has(label) || entries.length === 0) {
      return;
    }
    const section = renderGroupedSection(label, entries, version);
    if (section) {
      rendered.push(section);
    }
  });

  return rendered;
}

function renderGroupedSection(title: string, entries: GeneratedData[], version: string) {
  if (entries.length === 0) {
    return '';
  }
  const content = renderEntries(entries, version, 4);
  if (!content) {
    return '';
  }
  return `### ${title}\n\n${content}`;
}

function renderEntries(entries: GeneratedData[], version: string, level: number) {
  return entries
    .map(entry => renderEntryMarkdown(entry, version, level))
    .filter(Boolean)
    .join('\n\n');
}

function normalizePackageNames(packageName?: string | string[]) {
  if (!packageName) {
    return [];
  }
  return Array.isArray(packageName) ? packageName : [packageName];
}

function resolveVersion(forceVersion?: string, path?: string) {
  if (forceVersion) {
    return normalizeVersion(forceVersion);
  }
  if (!path) {
    return LATEST_VERSION;
  }
  const match = path.match(/\/versions\/(v[\d.]+|latest|unversioned)\//);
  if (!match) {
    return LATEST_VERSION;
  }
  return normalizeVersion(match[1]);
}

function normalizeVersion(version: string) {
  if (version === 'latest') {
    return LATEST_VERSION;
  }
  return version;
}

async function fetchPackageDataAsync(version: string, packageName: string) {
  const url = `/static/data/${version}/${packageName}.json`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch API data for ${packageName} (${version})`);
    }
    return (await response.json()) as ApiDataFile;
  } catch (error) {
    console.error('Unable to load API data for markdown conversion:', error);
    return null;
  }
}

function isHook(entry: GeneratedData) {
  return Boolean(entry.name?.startsWith('use') && !HOOK_EXCEPTIONS.has(entry.name));
}

function isListener(entry: GeneratedData) {
  return Boolean(entry.name?.endsWith('Listener') || entry.name?.endsWith('Listeners'));
}

const componentTypeNames = new Set(['React.FC', 'ForwardRefExoticComponent', 'ComponentType']);
const disallowedConstantNames = new Set([
  'default',
  'Constants',
  'EventEmitter',
  'SharedObject',
  'NativeModule',
]);

function isComponentLike(entry: GeneratedData) {
  return Boolean(entry.type?.name && componentTypeNames.has(entry.type.name));
}

function isConstant(entry: GeneratedData) {
  const name = entry.name ?? '';
  return !disallowedConstantNames.has(name) && !isComponentLike(entry);
}

function isProp(entry: GeneratedData) {
  const name = entry.name ?? '';
  return (
    name.includes('Props') &&
    name !== 'ErrorRecoveryProps' &&
    name !== 'WebAnchorProps' &&
    name !== 'ScreenProps'
  );
}

function isValidTypeAlias(entry: GeneratedData) {
  const type = (entry as unknown as { type?: TypeDefinitionData }).type;
  if (!type) {
    return false;
  }

  if ((entry as unknown as { variant?: string }).variant === 'reference') {
    return false;
  }

  const hasStructure =
    type.declaration ??
    type.types?.length ??
    type.typeArguments?.length ??
    type.element ??
    type.elementType ??
    type.elements?.length ??
    type.type ??
    type.name;

  return Boolean(hasStructure);
}

function getMethodHeader(entry: GeneratedData) {
  const signature = (entry as MethodDefinitionData).signatures?.[0];
  if (!signature) {
    return undefined;
  }

  const headerTag = signature.comment?.blockTags?.find(tag => tag.tag === METHOD_HEADER_TAG);
  if (!headerTag) {
    return undefined;
  }

  const header = getCommentContent(headerTag.content ?? []);
  return header === '' ? undefined : header;
}

function renderEntryMarkdown(entry: GeneratedData, version: string, level = 3): string {
  const heading = `${'#'.repeat(level)} ${entry.name}`;
  const kindLabel = kindToLabel(entry.kind);
  const description = formatComment(entry.comment);
  const entryPlatforms = extractPlatforms(entry.comment);
  const entryPlatformText = formatPlatforms(entryPlatforms);

  const lines: string[] = [`${heading} (*${kindLabel}*)`];
  if (description) {
    lines.push('', description);
  }
  if (entryPlatformText) {
    lines.push('', entryPlatformText);
  }

  switch (entry.kind) {
    case TypeDocKind.Class:
      lines.push(renderClassMarkdown(entry, version, level + 1));
      break;
    case TypeDocKind.Function:
      lines.push(renderFunctionsMarkdown([entry as MethodDefinitionData], version));
      break;
    case TypeDocKind.Interface:
      lines.push(renderInterfaceMarkdown(entry, version, level + 1));
      break;
    case TypeDocKind.Enum:
      lines.push(renderEnumMarkdown(entry, version));
      break;
    case TypeDocKind.Variable:
      lines.push(renderConstantMarkdown(entry, version));
      break;
    case TypeDocKind.TypeAlias:
    case TypeDocKind.TypeAlias_Legacy:
      lines.push(renderTypeAliasMarkdown(entry, version));
      break;
    default:
      if ('signatures' in entry && entry.signatures) {
        lines.push(renderFunctionsMarkdown([entry as MethodDefinitionData], version));
      }
      break;
  }

  return lines.filter(Boolean).join('\n').trim();
}

function renderClassMarkdown(entry: GeneratedData, version: string, level: number) {
  const lines: string[] = [];
  const children = ((entry as any).children ?? []) as GeneratedData[];
  const properties = children.filter(child => child.kind === TypeDocKind.Property);
  const methods = children.filter(child => child.kind === TypeDocKind.Method);
  const events = children.filter(child => child.kind === TypeDocKind.Function);

  if (properties.length > 0) {
    lines.push(`${'#'.repeat(level)} Properties`);
    properties.forEach(prop => {
      lines.push(formatProperty(prop, version));
    });
  }

  if (methods.length > 0) {
    lines.push('', `${'#'.repeat(level)} Methods`);
    lines.push(renderFunctionsMarkdown(methods as unknown as MethodDefinitionData[], version));
  }

  if (events.length > 0) {
    lines.push('', `${'#'.repeat(level)} Functions`);
    lines.push(renderFunctionsMarkdown(events as unknown as MethodDefinitionData[], version));
  }

  return lines.filter(Boolean).join('\n');
}

function renderInterfaceMarkdown(entry: GeneratedData, version: string, level: number) {
  const properties = (((entry as any).children ?? []) as GeneratedData[]).filter(
    child => child.kind === TypeDocKind.Property
  );
  if (properties.length === 0) {
    return '';
  }
  const lines: string[] = [`${'#'.repeat(level)} Properties`];
  properties.forEach(prop => {
    lines.push(formatProperty(prop, version));
  });
  return lines.join('\n');
}

function renderEnumMarkdown(entry: GeneratedData, version: string) {
  const members = ((entry as any).children ?? []) as any[];
  if (members.length === 0) {
    return '';
  }
  const lines: string[] = ['#### Members'];
  members.forEach(member => {
    const description = formatComment(member.comment);
    const value = member.defaultValue ? ` = ${member.defaultValue}` : '';
    lines.push(`- \`${member.name}\`${value}${description ? ` — ${description}` : ''}`);
  });
  return lines.join('\n');
}

function renderConstantMarkdown(entry: GeneratedData, version: string) {
  const typeString = typeToString(entry.type, version);
  const description = formatComment(entry.comment);
  const defaultValue = (entry as any).defaultValue;
  const value = defaultValue ? ` = ${defaultValue}` : '';
  const details = [description, value].filter(Boolean).join(' ');
  return `- \`${entry.name}\`${typeString ? ` (${typeString})` : ''}${
    details ? ` — ${details.trim()}` : ''
  }`;
}

function renderTypeAliasMarkdown(entry: GeneratedData, version: string) {
  const typeDefinition = entry.type;
  if (!typeDefinition) {
    return '';
  }

  const properties = extractTypeAliasProperties(typeDefinition);
  if (properties.length > 0) {
    const rows = properties
      .map(property => renderTypeAliasPropertyRow(property as GeneratedData, version))
      .filter(Boolean);
    if (rows.length === 0) {
      return '';
    }
    return ['| Property | Type | Description |', '| --- | --- | --- |', ...rows].join('\n');
  }

  const typeString = typeToString(typeDefinition, version);
  return typeString ? `Type: ${typeString}` : '';
}

function renderFunctionsMarkdown(entries: MethodDefinitionData[], version: string) {
  return entries
    .map(entry => {
      const signatures = entry.signatures ?? [];
      if (signatures.length === 0) {
        return '';
      }
      return signatures
        .map(signature => formatMethodSignature(entry, signature, version))
        .filter(Boolean)
        .join('\n\n');
    })
    .filter(Boolean)
    .join('\n\n');
}

function formatMethodSignature(
  entry: MethodDefinitionData,
  signature: MethodSignatureData,
  version: string
) {
  const params = (signature.parameters ?? []).map(param => {
    const optional = param.flags?.isOptional ? '?' : '';
    const paramType = typeToString(param.type, version);
    return `${param.name}${optional}${paramType ? `: ${paramType}` : ''}`;
  });
  const signatureName = signature.name ?? entry.name;
  const returnType = typeToString(signature.type, version);
  const header = `- \`${signatureName}(${params.join(', ')})${
    returnType && returnType !== 'void' ? `: ${returnType}` : ''
  }\``;

  const detailLines: string[] = [];
  const summary = formatComment(signature.comment ?? entry.comment);
  if (summary) {
    detailLines.push(summary);
  }

  const platforms = extractPlatforms(signature.comment ?? entry.comment);
  const platformText = formatPlatforms(platforms);
  if (platformText) {
    detailLines.push(platformText);
  }

  const parametersTable = renderParametersTable(signature.parameters ?? [], version);
  if (parametersTable) {
    detailLines.push(parametersTable);
  }

  const returnComment = getBlockTag(signature.comment ?? entry.comment, 'returns');
  if (returnComment) {
    detailLines.push(`Returns: ${returnComment}`);
  }

  const examples = getBlockTag(signature.comment ?? entry.comment, 'example');
  if (examples) {
    detailLines.push(`Example:\n${examples}`);
  }

  if (detailLines.length === 0) {
    return header;
  }

  const indented = detailLines
    .map(line =>
      line
        .split('\n')
        .map(part => `  ${part}`)
        .join('\n')
    )
    .join('\n');

  return `${header}\n${indented}`;
}

function formatProperty(prop: GeneratedData, version: string) {
  const optional = (prop as any).flags?.isOptional ? '?' : '';
  const typeString = typeToString(prop.type, version);
  const description = formatComment(prop.comment);
  const defaultValue = (prop as any).defaultValue;
  const platforms = extractPlatforms(prop.comment);
  const headerParts = [`- \`${prop.name}${optional}\``];
  if (typeString) {
    headerParts.push(`(${typeString})`);
  }

  const details: string[] = [];
  if (description) {
    details.push(description);
  }
  if (defaultValue) {
    details.push(`Default: \`${defaultValue}\``);
  }
  const platformText = formatPlatforms(platforms);
  if (platformText) {
    details.push(platformText);
  }

  if (details.length === 0) {
    return headerParts.join(' ');
  }

  const formattedDetails = details
    .map(line =>
      line
        .split('\n')
        .map(part => `  ${part}`)
        .join('\n')
    )
    .join('\n');

  return `${headerParts.join(' ')}\n${formattedDetails}`;
}

function renderTypeAliasPropertyRow(prop: GeneratedData, version: string) {
  const nameParts = [`\`${prop.name}\``];
  if ((prop as any).flags?.isOptional) {
    nameParts.push('*(optional)*');
  }

  const typeString = typeToString(prop.type, version) || '-';

  const descriptionParts: string[] = [];
  const summary = formatComment(prop.comment);
  if (summary) {
    descriptionParts.push(summary);
  }

  const defaultTag = getBlockTag(prop.comment, 'default');
  if (defaultTag) {
    descriptionParts.push(`Default: \`${defaultTag}\``);
  }

  const platformText = formatPlatforms(extractPlatforms(prop.comment));
  if (platformText) {
    descriptionParts.push(platformText);
  }

  const description = descriptionParts.length > 0 ? descriptionParts.join(' ') : '-';

  return `| ${escapeTableCell(nameParts.join(' '))} | ${escapeTableCell(typeString)} | ${escapeTableCell(description)} |`;
}

function extractTypeAliasProperties(typeDefinition: TypeDefinitionData) {
  const collected: GeneratedData[] = [];
  const seen = new Set<string>();

  const visit = (node?: TypeDefinitionData) => {
    if (!node) {
      return;
    }

    const declaration = node.declaration;
    if (declaration?.children?.length) {
      declaration.children.forEach(child => {
        if (!child) {
          return;
        }
        const id = `${child.name ?? ''}-${child.kind ?? ''}`;
        if (!seen.has(id)) {
          collected.push(child as unknown as GeneratedData);
          seen.add(id);
        }
      });
    }

    (node.types ?? []).forEach(visit);
    (node.typeArguments ?? []).forEach(visit);
    if (node.elementType) {
      visit(node.elementType);
    }
  };

  visit(typeDefinition);

  return collected;
}

function renderParametersTable(parameters: MethodParamData[], version: string) {
  if (!parameters.length) {
    return '';
  }

  const rows = parameters.map(param => renderParameterRow(param, version)).filter(Boolean);

  if (!rows.length) {
    return '';
  }

  return ['| Parameter | Type | Description |', '| --- | --- | --- |', ...rows].join('\n');
}

function renderParameterRow(param: MethodParamData, version: string) {
  const nameParts = [`\`${param.name}\``];
  if (param.flags?.isOptional) {
    nameParts.push('*(optional)*');
  }

  const typeString = typeToString(param.type, version) || '-';

  const descriptionParts: string[] = [];
  const summary = formatComment(param.comment);
  if (summary) {
    descriptionParts.push(summary);
  }

  const defaultTag = getBlockTag(param.comment, 'default');
  if (defaultTag) {
    descriptionParts.push(`Default: \`${defaultTag}\``);
  }

  const platformText = formatPlatforms(extractPlatforms(param.comment));
  if (platformText) {
    descriptionParts.push(platformText);
  }

  const description = descriptionParts.length > 0 ? descriptionParts.join(' ') : '-';

  return `| ${escapeTableCell(nameParts.join(' '))} | ${escapeTableCell(typeString)} | ${escapeTableCell(description)} |`;
}

function formatComment(comment?: CommentData) {
  if (!comment?.summary || comment.summary.length === 0) {
    return '';
  }
  return getCommentContent(comment.summary);
}

function getBlockTag(comment: CommentData | undefined, tag: string) {
  const normalized = tag.startsWith('@') ? tag : `@${tag}`;
  const block = comment?.blockTags?.find(
    blockTag => blockTag.tag === tag || blockTag.tag === normalized
  );
  if (!block) {
    return '';
  }
  return getCommentContent(block.content);
}

function extractPlatforms(comment: CommentData | undefined) {
  const platformTags = getAllTagData('platform', comment) ?? [];
  return platformTags
    .map(tag => getCommentContent(tag.content ?? []))
    .map(value => value.trim())
    .filter(Boolean);
}

function formatPlatforms(platforms: string[]) {
  const displayNames = getDisplayPlatformNames(platforms);
  if (displayNames.length === 0) {
    return '';
  }
  const label = displayNames.length === 1 ? 'platform' : 'platforms';
  return `Available on ${label}: ${displayNames.join(', ')}`;
}

function getDisplayPlatformNames(platforms: string[]) {
  const toDisplayName = (platform: string) => {
    const trimmed = platform.trim();
    if (!trimmed) {
      return '';
    }
    const base = trimmed.replace(/\*+$/, '');
    const isDeviceOnly = trimmed.endsWith('*');
    if (isDeviceOnly && ['ios', 'android'].includes(base.toLowerCase())) {
      return `${base} (device-only)`;
    }
    return base;
  };

  return Array.from(
    new Set(
      platforms
        .map(toDisplayName)
        .map(name => name.trim())
        .filter(Boolean)
    )
  );
}

function escapeTableCell(value: string) {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

function typeToString(typeDefinition: TypeDefinitionData | undefined, version: string): string {
  if (!typeDefinition) {
    return '';
  }

  const { type } = typeDefinition;

  switch (type) {
    case 'intrinsic':
      return typeDefinition.name ?? 'unknown';
    case 'reference': {
      const base = typeDefinition.qualifiedName ?? typeDefinition.name ?? 'unknown';
      const generics = (typeDefinition.typeArguments ?? [])
        .map(argument => typeToString(argument, version))
        .join(', ');
      return generics ? `${base}<${generics}>` : base;
    }
    case 'union':
      return (typeDefinition.types ?? [])
        .map(inner => typeToString(inner, version))
        .filter(Boolean)
        .join(' | ');
    case 'intersection':
      return (typeDefinition.types ?? [])
        .map(inner => typeToString(inner, version))
        .filter(Boolean)
        .join(' & ');
    case 'array':
      if (typeDefinition.elementType) {
        return `${typeToString(typeDefinition.elementType, version)}[]`;
      }
      return `${typeToString(typeDefinition.element ?? (typeDefinition.types?.[0] as any), version)}[]`;
    case 'literal':
      if (typeof typeDefinition.value === 'string') {
        return `'${typeDefinition.value}'`;
      }
      return String(typeDefinition.value);
    case 'reflection':
      if (typeDefinition.declaration?.signatures?.length) {
        return typeDefinition.declaration.signatures
          .map(signature => {
            const params = (signature.parameters ?? [])
              .map(param => `${param.name}: ${typeToString(param.type, version)}`)
              .join(', ');
            const returnType = typeToString(signature.type, version);
            return `(${params}) => ${returnType}`;
          })
          .join(' | ');
      }
      if (typeDefinition.declaration?.children?.length) {
        const entries = typeDefinition.declaration.children
          .map(child => `${child.name}: ${typeToString(child.type, version)}`)
          .join('; ');
        return `{ ${entries} }`;
      }
      return 'object';
    case 'tuple':
      return `[${(typeDefinition.elements ?? [])
        .map(element => typeToString(element, version))
        .join(', ')}]`;
    case 'conditional':
      return [
        typeToString(typeDefinition.checkType, version),
        'extends',
        typeToString(typeDefinition.extendsType, version),
        '?',
        typeToString(typeDefinition.trueType, version),
        ':',
        typeToString(typeDefinition.falseType, version),
      ]
        .filter(Boolean)
        .join(' ');
    default:
      return typeDefinition.name ?? typeDefinition.type ?? '';
  }
}

function kindToLabel(kind: TypeDocKind | undefined) {
  switch (kind) {
    case TypeDocKind.Class:
      return 'Class';
    case TypeDocKind.Function:
      return 'Function';
    case TypeDocKind.Enum:
      return 'Enum';
    case TypeDocKind.Interface:
      return 'Interface';
    case TypeDocKind.TypeAlias:
    case TypeDocKind.TypeAlias_Legacy:
      return 'Type';
    case TypeDocKind.Variable:
      return 'Constant';
    default:
      return 'Definition';
  }
}
