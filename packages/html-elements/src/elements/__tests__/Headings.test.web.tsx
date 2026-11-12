import { render } from '@testing-library/react';

import { H1, H2, H3, H4, H5, H6 } from '../Headings';

const headingFontSizes = [
  ['h1', H1, '2rem'],
  ['h2', H2, '1.5rem'],
  ['h3', H3, '1.17rem'],
  ['h4', H4, '1rem'],
  ['h5', H5, '0.83rem'],
  ['h6', H6, '0.67rem'],
] as const;

function declaredFontSize(element: Element): string | undefined {
  const classes = element.className.split(/\s+/).filter(Boolean);
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSStyleRule) || !rule.cssText.includes('font-size:')) {
        continue;
      }
      const selector = rule.selectorText;
      if (!classes.some((className) => new RegExp(`\\.${className}(?![\\w-])`).test(selector))) {
        continue;
      }
      const value = rule.style.getPropertyValue('font-size');
      if (value) {
        return value;
      }
    }
  }
  return undefined;
}

it.each(headingFontSizes)('%s font size uses the root font size', (tag, Heading, fontSize) => {
  const { container } = render(<Heading>Title</Heading>);
  const heading = container.querySelector(tag);
  expect(heading).not.toBeNull();
  expect(declaredFontSize(heading!)).toBe(fontSize);
});
