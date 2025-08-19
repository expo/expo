/** @jest-environment jsdom */
import { render } from '@testing-library/react';
import React from 'react';

import { LoaderDataScript } from '../html';

describe('<LoaderDataScript>', () => {
  it('renders script tag with loader data', () => {
    const data = { '/': { foo: 'bar' } };
    const { container } = render(<LoaderDataScript data={data} />);
    const scriptElement = container.querySelector('script[data-testid="loader-script"]');

    expect(scriptElement).not.toBeNull();
    expect(scriptElement?.getAttribute('type')).toBe('module');
    expect(scriptElement?.innerHTML).toContain('window.__EXPO_ROUTER_LOADER_DATA__');
    expect(scriptElement?.innerHTML).toContain('JSON.parse(\"{\\\"\\\\u002F\\\":{\\\"foo\\\":\\\"bar\\\"}}\");');
  });

  it('handles special characters', () => {
    const data = {
      '/': {
        dangerous: '<script>alert("XSS")</script>',
        nested: { value: '</script><script>alert("nested")</script>' },
        multiple: '<<<multiple>>>',
        mixed: 'Text with <tag> and </tag>',
        quotes: 'He said "Hello"',
        backslash: 'C:\\Users\\test',
        newline: 'Line 1\nLine 2',
        unicode: '你好世界 🌍',
      },
    };
    const { container } = render(<LoaderDataScript data={data} />);
    const scriptElement = container.querySelector('script[data-testid="loader-script"]');
    const content = scriptElement?.innerHTML || '';

    expect(content).not.toContain('<script>');
    expect(content).not.toContain('</script>');
    expect(content).toContain('\\\\u003Cscript');
    expect(content).toContain('\\\\u003C\\\\u002Fscript');

    const unescapedMatches = content.match(/(?<!\\u003C)</g);
    expect(unescapedMatches).toBeNull();
    expect(content).toContain('\\\\u003C\\\\u003C\\\\u003Cmultiple');
    expect(content).toContain('\\\\u003Ctag');
    expect(content).toContain('\\\\u003C\\\\u002Ftag');

    expect(content).toContain('\\\\\\\"Hello\\\\\\\"');
    expect(content).toContain('"C:\\\\\\\\Users\\\\\\\\test\\\"');
    expect(content).toContain('\\n');
    expect(content).toContain('你好世界');
  });
});
