import { batchProcessAllSourcesAsync, shouldProcess } from './ProcessSources.web';
export async function batchResolveAllFontsAsync(element) {
    const fontCSSStyles = await findAllFontsForDocumentAsync();
    const styleNode = document.createElement('style');
    element.appendChild(styleNode);
    styleNode.appendChild(document.createTextNode(fontCSSStyles.join('\n')));
    return element;
}
async function findAllFontsForDocumentAsync() {
    const styleSheets = document.styleSheets;
    const sheets = Array.from(styleSheets);
    const cssRules = getCSSRules(sheets);
    const rulesToProcess = cssRules
        .filter(({ type }) => type === CSSRule.FONT_FACE_RULE)
        .filter(({ style }) => shouldProcess(style.getPropertyValue('src')));
    return await Promise.all(rulesToProcess.map(item => createNewFontForCSSRule(item)));
}
async function createNewFontForCSSRule({ parentStyleSheet, cssText, }) {
    let initialURL;
    if (parentStyleSheet && parentStyleSheet.href != null) {
        initialURL = parentStyleSheet.href;
    }
    return await batchProcessAllSourcesAsync(cssText, initialURL);
}
function getCSSRules(styleSheets) {
    const cssRules = [];
    for (const sheet of styleSheets) {
        try {
            const rules = Array.from(sheet.cssRules);
            cssRules.push(...rules);
        }
        catch ({ message }) {
            throw new Error(`Error while reading CSS rules from ${sheet.href}: ${message}`);
        }
    }
    return cssRules;
}
//# sourceMappingURL=Fonts.web.js.map