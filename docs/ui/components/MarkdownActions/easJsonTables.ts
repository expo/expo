const ResourceClasses = {
  android: ['medium', 'large'],
  ios: ['medium', 'large'],
} as const;

const TABLE_HEADER = '| Property | Description |\n| --- | --- |';

export async function generateEasJsonPropertiesTableMarkdownAsync(schemaImportPath: string) {
  const schema = await loadSchemaAsync(schemaImportPath);
  const rows: string[] = [];
  schema.forEach(property => {
    appendProperty(rows, property, 0);
  });

  const tableRows = rows.join('\n');

  return `${TABLE_HEADER}\n${tableRows}`;
}

type SchemaProperty = {
  name: string;
  type?: string | string[];
  enum?: string[];
  description?: string[];
  properties?: SchemaProperty[];
};

async function loadSchemaAsync(importPath: string) {
  const relativePath = importPath.replace(/^~\/public/, '');
  const url = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch schema from ${url}`);
    }

    const source = await response.text();
    const sanitized = source.replace(/^import.*$/gm, '').replace(/export default/, 'return');

    // eslint-disable-next-line no-new-func
    const factory = new Function('ResourceClasses', sanitized);
    return factory(ResourceClasses) as SchemaProperty[];
  } catch (error) {
    console.error('Unable to load schema for Markdown conversion:', error);
    return [];
  }
}

function appendProperty(rows: string[], property: SchemaProperty, level: number) {
  const indent = level === 0 ? '' : '&nbsp;'.repeat(level * 4) + '• ';
  const nameCell = `${indent}\`${property.name}\``;
  const descriptionCell = formatDescription(property);

  rows.push(`| ${escapePipes(nameCell)} | ${escapePipes(descriptionCell)} |`);

  (property.properties ?? []).forEach(child => {
    appendProperty(rows, child, level + 1);
  });
}

function formatDescription(property: SchemaProperty) {
  const type = getType(property);
  const parts: string[] = [];
  if (type) {
    parts.push(`**(${type})**`);
  }
  if (property.description?.length) {
    parts.push(property.description.join('<br>'));
  }

  return parts.join(' - ');
}

function getType(property: SchemaProperty) {
  if (property.enum) {
    return `enum: ${property.enum.join(', ')}`;
  }

  if (Array.isArray(property.type)) {
    return property.type.join(' || ');
  }

  return property.type ?? '';
}

function escapePipes(value: string) {
  return value.replace(/\|/g, '\\|');
}
