import { parse } from 'acorn';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { visit } from 'unist-util-visit';

const { LATEST_VERSION } = JSON.parse(
  readFileSync(join(process.cwd(), 'public/static/constants/versions.json'), 'utf8')
);

// Collects every <APISection packageName=... /> usage so the page's generated
// `getStaticProps` (see remark-create-static-props) loads the matching API data
// JSON at build time instead of webpack bundling the whole data directory into
// the client chunks. APISection reads the data back through providers/api-data.
export default function remarkApiSectionData() {
  return function transformer(tree, file) {
    const entries = new Map();

    visit(tree, ['mdxJsxFlowElement', 'mdxJsxTextElement'], node => {
      if (node.name !== 'APISection') {
        return;
      }
      const version = resolveVersion(node, file);
      for (const name of readPackageNames(node, file)) {
        const key = `${version}/${name}`;
        // Data files can be absent for older SDK versions; APISection then renders
        // its "No API data file found" fallback, same as the previous runtime require.
        if (
          !entries.has(key) &&
          existsSync(join(process.cwd(), 'public/static/data', `${key}.json`))
        ) {
          entries.set(key, `__apiSectionData${entries.size}`);
        }
      }
    });

    if (entries.size === 0) {
      return;
    }

    const imports = [...entries]
      .map(([key, id]) => `import ${id} from '~/public/static/data/${key}.json';`)
      .join('\n');
    tree.children.unshift({
      type: 'mdxjsEsm',
      data: { estree: parse(imports, { sourceType: 'module', ecmaVersion: 2022 }) },
    });
    file.data.apiSectionDataExpression = `{ ${[...entries]
      .map(([key, id]) => `'${key}': ${id}.children`)
      .join(', ')} }`;
  };
}

function readPackageNames(node, file) {
  const attribute = node.attributes?.find(
    entry => entry.type === 'mdxJsxAttribute' && entry.name === 'packageName'
  );
  if (!attribute) {
    return [];
  }
  if (typeof attribute.value === 'string') {
    return [attribute.value];
  }
  const expression = attribute.value?.data?.estree?.body?.[0]?.expression;
  if (
    expression?.type === 'ArrayExpression' &&
    expression.elements.every(
      element => element?.type === 'Literal' && typeof element.value === 'string'
    )
  ) {
    return expression.elements.map(element => element.value);
  }
  throw new Error(
    `<APISection> in ${file.path} uses a non-literal packageName (${attribute.value?.value ?? attribute.value}). ` +
      'API data is resolved at build time, so packageName must be a string literal or an array of string literals.'
  );
}

function resolveVersion(node, file) {
  const attribute = node.attributes?.find(
    entry => entry.type === 'mdxJsxAttribute' && entry.name === 'forceVersion'
  );
  if (attribute && typeof attribute.value !== 'string') {
    throw new Error(
      `<APISection> in ${file.path} uses a non-literal forceVersion. ` +
        'API data is resolved at build time, so forceVersion must be a string literal.'
    );
  }
  // Mirrors the runtime resolution in APISection: the version segment of the URL
  // (via PageApiVersionProvider, which defaults to `latest` outside /versions/),
  // with `latest` mapped to the newest released version.
  const pathVersion = file.path?.match(/[/\\]pages[/\\]versions[/\\]([^/\\]+)[/\\]/)?.[1];
  const version = attribute?.value ?? pathVersion ?? 'latest';
  return version === 'latest' ? LATEST_VERSION : version;
}
