import { batchProcessAllSourcesAsync, shouldProcess } from './ProcessSources.web';

declare var document: Document;

export async function batchResolveAllFontsAsync(element: HTMLElement): Promise<HTMLElement> {
  const fontCSSStyles = await findAllFontsForDocumentAsync();
  const styleNode = document.createElement('style');
  element.appendChild(styleNode);
  styleNode.appendChild(document.createTextNode(fontCSSStyles.join('\n')));
  return element;
}

async function findAllFontsForDocumentAsync(): Promise<string[]> {
  const styleSheets: StyleSheetList = document.styleSheets;
  const sheets: any[] = Array.from(styleSheets);
  const cssRules = getCSSRules(sheets);
  const rulesToProcess = cssRules
    .filter(({ type }) => type === CSSRule.FONT_FACE_RULE)
    .filter(({ style }) => shouldProcess(style.getPropertyValue('src')));

  return await Promise.all(rulesToProcess.map(item => createNewFontForCSSRule(item)));
}

async function createNewFontForCSSRule({
  parentStyleSheet,
  cssText,
}: CSSStyleRule): Promise<string> {
  let initialURL;
  if (parentStyleSheet && parentStyleSheet.href != null) {
    initialURL = parentStyleSheet.href;
  }
  return await batchProcessAllSourcesAsync(cssText, initialURL);
}

function getCSSRules(styleSheets: CSSStyleSheet[]): CSSStyleRule[] {
  const cssRules: CSSStyleRule[] = [];
  for (const sheet of styleSheets) {
    try {
      const rules: CSSRule[] = Array.from(sheet.cssRules);
      rules.forEach(cssRules.push.bind(cssRules));
    } catch ({ message }) {
      throw new Error(`Error while reading CSS rules from ${sheet.href}: ${message}`);
    }
  }
  return cssRules;
}
