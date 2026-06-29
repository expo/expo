import { describe, expect, it } from '@jest/globals';
import { renderToStaticMarkup as toStaticMarkup } from 'react-dom/server.node';
import { IntlProvider } from 'react-intl';

import { Tab } from './Tab';
import { Tabs } from './Tabs';

function ssr(element: React.ReactElement) {
  const markup = toStaticMarkup(<IntlProvider locale="en">{element}</IntlProvider>);
  const doc = new DOMParser().parseFromString(markup, 'text/html');
  return { markup, doc };
}

describe('Tabs server rendering', () => {
  it('hides inactive panels on the server so there is no layout shift on hydration', () => {
    const { doc } = ssr(
      <Tabs>
        <Tab label="One">PanelOne</Tab>
        <Tab label="Two">PanelTwo</Tab>
        <Tab label="Three">PanelThree</Tab>
      </Tabs>
    );

    const panels = [...doc.querySelectorAll('[data-reach-tab-panel]')];
    expect(panels).toHaveLength(3);

    const byText = (text: string) => panels.find(p => p.textContent?.includes(text));
    expect(byText('PanelOne')?.hasAttribute('hidden')).toBe(false);
    expect(byText('PanelTwo')?.hasAttribute('hidden')).toBe(true);
    expect(byText('PanelThree')?.hasAttribute('hidden')).toBe(true);
  });

  it('keeps every panel in the server markup (preserves SEO/a11y)', () => {
    const { markup } = ssr(
      <Tabs>
        <Tab label="One">PanelOne</Tab>
        <Tab label="Two">PanelTwo</Tab>
      </Tabs>
    );
    expect(markup).toContain('PanelOne');
    expect(markup).toContain('PanelTwo');
  });

  it('gives each panel a unique id on the server', () => {
    const { doc } = ssr(
      <Tabs>
        <Tab label="One">PanelOne</Tab>
        <Tab label="Two">PanelTwo</Tab>
      </Tabs>
    );
    const ids = [...doc.querySelectorAll('[data-reach-tab-panel]')].map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
