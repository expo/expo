import partition from 'lodash/partition';
import { Language, Prism } from 'prism-react-renderer';
import { Children, ReactElement, ReactNode, isValidElement } from 'react';

// Read more: https://github.com/FormidableLabs/prism-react-renderer#custom-language-support
async function initPrism() {
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
}

await initPrism();

export const EXPAND_SNIPPET_BOUND = 408;
export const LANGUAGES_REMAP: Record<string, string> = {
  'objective-c': 'objc',
  sh: 'bash',
  rb: 'ruby',
};

export function cleanCopyValue(value: string) {
  return value
    .replace(/\/\*\s?@(info[^*]+|end|hide[^*]+).?\*\//g, '')
    .replace(/#\s?@(info[^#]+|end|hide[^#]+).?#/g, '')
    .replace(/<!--\s?@(info[^<>]+|end|hide[^<>]+).?-->/g, '')
    .replace(/\/\*\s?@(tutinfo[^*]+|end|hide[^*]+).?\*\//g, '')
    .replace(/#\s?@(tutinfo[^#]+|end|hide[^#]+).?#/g, '')
    .replace(/<!--\s?@(tutinfo[^<>]+|end|hide[^<>]+).?-->/g, '')
    .replace(/^ +\r?\n|\n +\r?$/gm, '');
}

export function escapeHtml(text: string) {
  return text.replace(/"/g, '&quot;');
}

export function replaceXmlCommentsWithAnnotations(value: string) {
  return value
    .replace(
      /<span class="token (comment|plain-text)">&lt;!-- @info (.*?)--><\/span>\s*/g,
      (match, type, content) => {
        return content
          ? `<span class="code-annotation with-tooltip" data-tippy-content="${escapeHtml(
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
          ? `<span class="code-annotation with-tooltip" data-tippy-content="${escapeHtml(
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
      /<span class="token (comment|plain-text)">([\n\r\s]*)\/\* @info (.*?)\*\/[\n\r\s]*<\/span>\s*/g,
      (match, type, beforeWhitespace, content) => {
        return content
          ? `${beforeWhitespace}<span class="code-annotation with-tooltip" data-tippy-content="${escapeHtml(
              content
            )}">`
          : `${beforeWhitespace}<span class="code-annotation">`;
      }
    )
    .replace(
      /<span class="token (comment|plain-text)">([\n\r\s]*)\/\* @hide (.*?)\*\/([\n\r\s]*)<\/span>\s*/g,
      (match, type, beforeWhitespace, content, afterWhitespace) => {
        return `<span><span class="code-hidden">%%placeholder-start%%</span><span class="code-placeholder">${beforeWhitespace}${escapeHtml(
          content
        )}${afterWhitespace}</span><span class="code-hidden">%%placeholder-end%%</span><span class="code-hidden">`;
      }
    )
    .replace(
      /\s*<span class="token (comment|plain-text)">[\n\r\s]*\/\* @end \*\/([\n\r\s]*)<\/span>/g,
      (match, type, afterWhitespace) => `</span>${afterWhitespace}`
    );
}

export function replaceSlashCommentsWithAnnotationsForTutorial(value: string) {
  return value
    .replace(
      /<span class="token (comment|plain-text)">([\n\r\s]*)\/\* @tutinfo (.*?)\*\/[\n\r\s]*<\/span>\s*/g,
      (match, type, beforeWhitespace, content) => {
        return content
          ? `${beforeWhitespace}<span class="tutorial-code-annotation with-tooltip" data-tippy-content="${escapeHtml(
              content
            )}">`
          : `${beforeWhitespace}<span class="tutorial-code-annotation">`;
      }
    )
    .replace(
      /<span class="token (comment|plain-text)">([\n\r\s]*)\/\* @hide (.*?)\*\/([\n\r\s]*)<\/span>\s*/g,
      (match, type, beforeWhitespace, content, afterWhitespace) => {
        return `<span><span class="code-hidden">%%placeholder-start%%</span><span class="code-placeholder">${beforeWhitespace}${escapeHtml(
          content
        )}${afterWhitespace}</span><span class="code-hidden">%%placeholder-end%%</span><span class="code-hidden">`;
      }
    )
    .replace(
      /\s*<span class="token (comment|plain-text)">[\n\r\s]*\/\* @end \*\/([\n\r\s]*)<\/span>/g,
      (match, type, afterWhitespace) => `</span>${afterWhitespace}`
    );
}

export function parseValue(value: string) {
  if (value.startsWith('@@@')) {
    const valueChunks = value.split('@@@');
    const titleChunks = valueChunks[1].split('|');
    const [params, title] = partition(
      titleChunks,
      chunk => chunk.includes('=') && !chunk.includes(' ')
    );
    return {
      title: title[0],
      params: Object.assign(
        {},
        ...params.map(param => {
          const [key, value] = param.split('=');
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

export function getRootCodeBlockProps(children: ReactNode, className?: string) {
  if (className && className.startsWith('language')) {
    return { className, children };
  }

  const firstChild = Children.toArray(children)[0];
  if (isValidElement(firstChild) && firstChild.props.className) {
    if (firstChild.props.className.startsWith('language')) {
      return {
        className: firstChild.props.className,
        children: firstChild.props.children,
        isNested: true,
      };
    }
  }

  return {};
}

export function findPropInChildren(element: ReactElement, propToFind: string): string | null {
  if (!element || typeof element !== 'object') return null;

  if (element.props && element.props[propToFind]) {
    return element.props[propToFind];
  }

  if (element.props && element.props.children) {
    const children = element.props.children;

    if (Array.isArray(children)) {
      for (const child of Children.toArray(children)) {
        const wantedProp: string | null = findPropInChildren(child as ReactElement, propToFind);
        if (wantedProp) return wantedProp;
      }
    } else {
      return findPropInChildren(children as ReactElement, propToFind);
    }
  }

  return null;
}

export function getCollapseHeight(params?: Record<string, string>) {
  const customCollapseHeight = params?.collapseHeight;
  return customCollapseHeight ? Number(customCollapseHeight) : EXPAND_SNIPPET_BOUND;
}

export function getCodeData(value: string, className?: string) {
  // mdx will add the class `language-foo` to codeblocks with the tag `foo`
  // if this class is present, we want to slice out `language-`
  let lang = className && className.split('-').at(-1)?.toLowerCase();
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

  const rawHtml = Prism.highlight(value, grammar, lang as Language);
  if (['properties', 'ruby', 'bash', 'yaml'].includes(lang)) {
    return replaceHashCommentsWithAnnotations(rawHtml);
  } else if (['xml', 'html'].includes(lang)) {
    return replaceXmlCommentsWithAnnotations(rawHtml);
  } else if (value.includes('tut')) {
    return replaceSlashCommentsWithAnnotationsForTutorial(rawHtml);
  } else {
    return replaceSlashCommentsWithAnnotations(rawHtml);
  }
}
