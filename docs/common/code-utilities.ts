import { Language, Prism } from 'prism-react-renderer';
import { Children, ReactElement, ReactNode, PropsWithChildren, isValidElement } from 'react';

import { sdkVersionValues } from '~/ui/components/SDKTables/utils';

import { toString } from './utilities';

/**
 * Build the code block variables map for a given SDK version entry.
 * Variables can be used in fenced code blocks with the `{{variableName}}` syntax.
 */
function buildVariablesForSdk(sdk: (typeof sdkVersionValues)[0]): Record<string, string> {
  return {
    '{{iosDeploymentTarget}}': sdk.ios.replace('+', ''),
    '{{androidVersion}}': sdk.android.replace('+', ''),
    '{{compileSdkVersion}}': sdk.compileSdkVersion,
    '{{targetSdkVersion}}': sdk.targetSdkVersion,
    '{{buildToolsVersion}}': sdk.buildToolsVersion,
    '{{reactNativeVersion}}': sdk['react-native'],
    '{{xcodeVersion}}': sdk.xcode.replace('+', ''),
    '{{nodeVersion}}': sdk.node,
    '{{reactVersion}}': sdk.react,
    '{{expoSdkVersion}}': sdk.sdk,
    '{{expoSdkMajorVersion}}': sdk.sdk.split('.')[0],
  };
}

const variablesCache = new Map<string, Record<string, string>>();

function getVariablesForVersion(version?: string): Record<string, string> {
  const cacheKey = version ?? 'latest';
  const cached = variablesCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  let sdk = sdkVersionValues[0];
  if (version && version !== 'latest' && version !== 'unversioned') {
    const normalized = version.replace(/^v/, '');
    const match = sdkVersionValues.find(s => s.sdk === normalized);
    if (match) {
      sdk = match;
    }
  }

  const variables = buildVariablesForSdk(sdk);
  variablesCache.set(cacheKey, variables);
  return variables;
}

function replaceCodeBlockVariables(value: string, version?: string): string {
  const variables = getVariablesForVersion(version);
  let result = value;
  for (const [key, val] of Object.entries(variables)) {
    result = result.replaceAll(key, val);
  }
  const unreplaced = result.match(/{{[A-Za-z]+}}/g);
  if (unreplaced) {
    throw new Error(
      `Unknown code block variable(s): ${[...new Set(unreplaced)].join(', ')}. ` +
        `Available: ${Object.keys(variables).join(', ')}`
    );
  }
  return result;
}

// Read more: https://github.com/FormidableLabs/prism-react-renderer#custom-language-support
async function initPrismAsync() {
  (typeof global !== 'undefined' ? global : window).Prism = Prism;
  await import('~/ui/components/Snippet/prism-bash' as Language);
  await import('prismjs/components/prism-diff' as Language);
  await import('prismjs/components/prism-groovy' as Language);
  await import('prismjs/components/prism-ini' as Language);
  await import('prismjs/components/prism-java' as Language);
  await import('prismjs/components/prism-json' as Language);
  await import('prismjs/components/prism-objectivec' as Language);
  await import('prismjs/components/prism-properties' as Language);
  await import('prismjs/components/prism-ruby' as Language);
  await import('prismjs/components/prism-ignore' as Language);
}

await initPrismAsync();

export const EXPAND_SNIPPET_BOUND = 340;
export const LANGUAGES_REMAP: Record<string, string> = {
  'objective-c': 'objc',
  sh: 'bash',
  rb: 'ruby',
};

export function cleanCopyValue(value: string, version?: string) {
  return replaceCodeBlockVariables(value, version)
    .replace(/\/\*\s?@(info[^*]+|end|hide[^*]+).?\*\//g, '')
    .replace(/#\s?@(info[^#]+|end|hide[^#]+).?#/g, '')
    .replace(/<!--\s?@(info[^<>]+|end|hide[^<>]+).?-->/g, '')
    .replace(/\/\*\s?@(tutinfo[^*]+|end|hide[^*]+).?\*\//g, '')
    .replace(/#\s?@(tutinfo[^#]+|end|hide[^#]+).?#/g, '')
    .replace(/<!--\s?@(tutinfo[^<>]+|end|hide[^<>]+).?-->/g, '')
    .replace(/%%placeholder-start%%.*%%placeholder-end%%/g, '')
    .replace(/^ +\r?\n|\n +\r?$/gm, '');
}

export function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function replaceXmlCommentsWithAnnotations(value: string) {
  return value
    .replace(
      /<span class="token (comment|plain-text)">&lt;!-- @info (.*?)--><\/span>\s*/g,
      (match, type, content) => {
        return content
          ? `<span class="code-annotation with-tooltip" tabindex="0" data-tooltip="${escapeHtml(
              content
            )}">`
          : '<span class="code-annotation">';
      }
    )
    .replace(
      /<span class="token (comment|plain-text)">&lt;!-- @hide (.*?)--><\/span>\s*/g,
      (match, type, content) => {
        return `<span><span class="code-hidden">%%placeholder-start%%</span><span class="code-placeholder">${escapeHtml(
          content
        )}</span><span class="code-hidden">%%placeholder-end%%</span><span class="code-hidden">`;
      }
    )
    .replace(/\s*<span class="token (comment|plain-text)">&lt;!-- @end --><\/span>/g, '</span>');
}

export function replaceHashCommentsWithAnnotations(value: string) {
  return value
    .replace(
      /<span class="token (comment|plain-text)"># @info (.*?)#<\/span>\s*/g,
      (match, type, content) => {
        return content
          ? `<span class="code-annotation with-tooltip" tabindex="0" data-tooltip="${escapeHtml(
              content
            )}">`
          : '<span class="code-annotation">';
      }
    )
    .replace(
      /<span class="token (comment|plain-text)"># @hide (.*?)#<\/span>\s*/g,
      (match, type, content) => {
        return `<span><span class="code-hidden">%%placeholder-start%%</span><span class="code-placeholder">${escapeHtml(
          content
        )}</span><span class="code-hidden">%%placeholder-end%%</span><span class="code-hidden">`;
      }
    )
    .replace(/\s*<span class="token (comment|plain-text)"># @end #<\/span>/g, '</span>');
}

export function replaceSlashCommentsWithAnnotations(value: string) {
  return value
    .replace(
      /<span clas{2}="token (com{2}ent|plain-text)">(\s*)\/\* @info (.*?)\*\/\s*<\/span>\s*/g,
      (match, type, beforeWhitespace, content) => {
        return content
          ? `${beforeWhitespace}<span class="code-annotation with-tooltip" tabindex="0" data-tooltip="${escapeHtml(
              content
            )}">`
          : `${beforeWhitespace}<span class="code-annotation">`;
      }
    )
    .replace(
      /<span clas{2}="token (com{2}ent|plain-text)">(\s*)\/\* @hide (.*?)\*\/(\s*)<\/span>\s*/g,
      (match, type, beforeWhitespace, content, afterWhitespace) => {
        return `<span><span class="code-hidden">%%placeholder-start%%</span><span class="code-placeholder">${beforeWhitespace}${escapeHtml(
          content
        )}${afterWhitespace}</span><span class="code-hidden">%%placeholder-end%%</span><span class="code-hidden">`;
      }
    )
    .replace(
      /\s*<span clas{2}="token (com{2}ent|plain-text)">\s*\/\* @end \*\/(\s*)<\/span>/g,
      (match, type, afterWhitespace) => `</span>${afterWhitespace}`
    );
}

export function replaceSlashCommentsWithAnnotationsForTutorial(value: string) {
  return value
    .replace(
      /<span clas{2}="token (com{2}ent|plain-text)">(\s*)\/\* @tutinfo (.*?)\*\/\s*<\/span>\s*/g,
      (match, type, beforeWhitespace, content) => {
        return content
          ? `${beforeWhitespace}<span class="tutorial-code-annotation with-tooltip" tabindex="0" data-tooltip="${escapeHtml(
              content
            )}">`
          : `${beforeWhitespace}<span class="tutorial-code-annotation">`;
      }
    )
    .replace(
      /<span clas{2}="token (com{2}ent|plain-text)">(\s*)\/\* @hide (.*?)\*\/(\s*)<\/span>\s*/g,
      (match, type, beforeWhitespace, content, afterWhitespace) => {
        return `<span><span class="code-hidden">%%placeholder-start%%</span><span class="code-placeholder">${beforeWhitespace}${escapeHtml(
          content
        )}${afterWhitespace}</span><span class="code-hidden">%%placeholder-end%%</span><span class="code-hidden">`;
      }
    )
    .replace(
      /\s*<span clas{2}="token (com{2}ent|plain-text)">\s*\/\* @end \*\/(\s*)<\/span>/g,
      (match, type, afterWhitespace) => `</span>${afterWhitespace}`
    );
}

function partition<T>(items: T[], predicate: (item: T) => boolean): [T[], T[]] {
  const matched: T[] = [];
  const rest: T[] = [];
  for (const item of items) {
    (predicate(item) ? matched : rest).push(item);
  }
  return [matched, rest];
}

export function parseValue(value: string) {
  if (value.startsWith('@@@')) {
    const valueChunks = value.split('@@@');
    const titleChunks = valueChunks[1].split('|');
    // Boolean params are bare flags (no `=`) because an `=` in the code fence meta
    // breaks Vale's code block detection via the TokenIgnores patterns in .vale.ini.
    const BOOLEAN_PARAMS = ['wrap'];
    const [params, title] = partition(
      titleChunks,
      chunk => (chunk.includes('=') && !chunk.includes(' ')) || BOOLEAN_PARAMS.includes(chunk)
    );
    return {
      title: title[0],
      params: Object.assign(
        {},
        ...params.map(param => {
          const [key, value = 'true'] = param.split('=');
          return { [key]: value };
        })
      ) as Record<string, string>,
      value: valueChunks[2],
    };
  }
  return {
    value,
  };
}

export function findNodeByPropInChildren<T>(
  element: ReactElement,
  propToFind: string
): PropsWithChildren<{ [propToFind]: T }> | T | null {
  if (!isValidElement<PropsWithChildren>(element)) {
    return null;
  }

  const props = element.props as PropsWithChildren<{ [propToFind]: T }>;
  if (props && Object.prototype.hasOwnProperty.call(props, propToFind)) {
    return props;
  }

  const { children } = props;
  if (!children) {
    return null;
  }

  if (Array.isArray(children)) {
    for (const child of Children.toArray(children)) {
      const found = findNodeByPropInChildren<T>(child as ReactElement, propToFind);
      if (found) {
        return found;
      }
    }
    return null;
  }

  return findNodeByPropInChildren<T>(children as ReactElement, propToFind);
}

export function getCodeBlockDataFromChildren(children?: ReactNode, className?: string) {
  if (typeof children === 'string') {
    return {
      ...parseValue(children),
      language: className ? className.split('-')[1] : 'jsx',
    };
  }
  const codeNode = findNodeByPropInChildren<PropsWithChildren<{ className: string }>>(
    children as ReactElement,
    'className'
  );
  const code = parseValue(toString(codeNode?.children));
  const codeLanguage =
    typeof codeNode?.className === 'string' ? codeNode.className.split('-')[1] : 'jsx';

  return { ...code, language: codeLanguage };
}

export function getCollapseHeight(params?: Record<string, string>) {
  const customCollapseHeight = params?.collapseHeight;
  return customCollapseHeight ? Number(customCollapseHeight) : EXPAND_SNIPPET_BOUND;
}

type OpenTag = { tagName: string; openingTag: string; classNames: string[] };

type CodeLine = {
  html: string;
  hasVisibleText: boolean;
  hasHiddenText: boolean;
  startsHidden: boolean;
  diffType?: 'added' | 'removed';
};

const HTML_TAG_PATTERN = /<(\/?)([A-Za-z]+)([^>]*)>/g;

function isInsideHiddenCode(stack: OpenTag[]) {
  return stack.some(tag => tag.classNames.includes('code-hidden'));
}

function getDiffType(stack: OpenTag[]) {
  const classNames = stack.flatMap(tag => tag.classNames);
  if (classNames.includes('inserted')) {
    return 'added';
  }
  if (classNames.includes('deleted')) {
    return 'removed';
  }
  return undefined;
}

function closeOpenTags(stack: OpenTag[]) {
  return stack
    .toReversed()
    .map(tag => `</${tag.tagName}>`)
    .join('');
}

function startCodeLine(stack: OpenTag[]): CodeLine {
  return {
    html: stack.map(tag => tag.openingTag.replace(/\s+tabindex="[^"]*"/, '')).join(''),
    hasVisibleText: false,
    hasHiddenText: false,
    startsHidden: isInsideHiddenCode(stack),
  };
}

function addTextToCodeLine(line: CodeLine, text: string, stack: OpenTag[], isDiff: boolean) {
  if (!text) {
    return;
  }
  line.html += text;
  if (isInsideHiddenCode(stack)) {
    line.hasHiddenText = true;
    return;
  }
  if (text.trim()) {
    line.hasVisibleText = true;
    if (isDiff && !line.diffType) {
      line.diffType = getDiffType(stack);
    }
  }
}

function renderCodeLine(line: CodeLine, isLast: boolean) {
  const isHidden = !line.hasVisibleText && (line.hasHiddenText || line.startsHidden);
  const classNames = [
    'code-line',
    isHidden && 'code-hidden',
    line.diffType && `code-line-${line.diffType}`,
  ].filter(Boolean);
  return `<span class="${classNames.join(' ')}"><span class="code-line-content">${line.html}${
    isLast ? '' : '\n'
  }</span></span>`;
}

export function wrapCodeLines(html: string, language?: string) {
  const isDiff = language === 'diff';
  const stack: OpenTag[] = [];
  const lines: CodeLine[] = [];
  let line = startCodeLine(stack);

  const addText = (text: string) => {
    const [first, ...rest] = text.split('\n');
    addTextToCodeLine(line, first, stack, isDiff);
    for (const segment of rest) {
      line.html += closeOpenTags(stack);
      lines.push(line);
      line = startCodeLine(stack);
      addTextToCodeLine(line, segment, stack, isDiff);
    }
  };

  let cursor = 0;
  for (const match of html.matchAll(HTML_TAG_PATTERN)) {
    addText(html.slice(cursor, match.index));
    cursor = match.index + match[0].length;
    const [tag, isClosing, tagName, attributes] = match;
    if (isClosing) {
      if (stack.length > 0) {
        stack.pop();
        line.html += tag;
      }
      continue;
    }
    const classNames = attributes.match(/class="([^"]*)"/)?.[1].split(/\s+/) ?? [];
    stack.push({ tagName, openingTag: tag, classNames });
    line.html += tag;
  }
  addText(html.slice(cursor));
  line.html += closeOpenTags(stack);
  lines.push(line);

  const lastLine = lines.at(-1);
  if (lines.length > 1 && lastLine && !lastLine.hasVisibleText && !lastLine.hasHiddenText) {
    lines.pop();
  }

  return lines
    .map((codeLine, index) => renderCodeLine(codeLine, index === lines.length - 1))
    .join('');
}

export function getCodeData(value: string, className?: string, version?: string) {
  // mdx will add the class `language-foo` to codeblocks with the tag `foo`
  // if this class is present, we want to slice out `language-`
  let lang = className?.split('-').at(-1)?.toLowerCase();
  if (!lang) {
    return value;
  }

  if (lang in LANGUAGES_REMAP) {
    lang = LANGUAGES_REMAP[lang];
  }

  const grammar = Prism.languages[lang as keyof typeof Prism.languages];
  if (!grammar) {
    throw new Error(`docs currently do not support language: ${lang}`);
  }

  const processedValue = replaceCodeBlockVariables(value, version);
  const rawHtml = Prism.highlight(processedValue, grammar, lang);
  if (['properties', 'ruby', 'bash', 'yaml', 'yml'].includes(lang)) {
    return replaceHashCommentsWithAnnotations(rawHtml);
  } else if (['xml', 'html'].includes(lang)) {
    return replaceXmlCommentsWithAnnotations(rawHtml);
  } else if (value.includes('tut')) {
    return replaceSlashCommentsWithAnnotationsForTutorial(rawHtml);
  } else {
    return replaceSlashCommentsWithAnnotations(rawHtml);
  }
}
