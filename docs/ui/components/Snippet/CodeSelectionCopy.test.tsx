/* oxlint-disable testing-library/no-node-access */
import { jest } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { CodeSelectionCopy } from './CodeSelectionCopy';

const CODE_BLOCK = `
  <pre data-md-lang="json"><code id="code">{
  "expo": { "userInterfaceStyle": "automatic" }
}</code></pre>`;

const HIDDEN_CODE_BLOCK = `
  <pre data-md-lang="java"><code id="code">visible start
<span class="code-hidden">%%placeholder-start%%</span><span class="code-placeholder">...</span><span class="code-hidden">hidden code</span>visible end</code></pre>`;

const DIFF_BLOCK = `
  <table class="diff-unified"><tbody id="diff-body">
    <tr><td class="diff-gutter">1</td><td class="diff-code">package com.myapp</td></tr>
    <tr><td class="diff-gutter">2</td><td class="diff-code">import expo.modules.Wrapper</td></tr>
  </tbody></table>`;

const PROSE = '<p><span id="prose">Some regular paragraph text on the page.</span></p>';

let fixture: HTMLDivElement;
let writeText: jest.Mock<() => Promise<void>>;

function renderWithFixture(html: string) {
  render(<CodeSelectionCopy />);
  fixture.innerHTML = html;
  return fixture;
}

function mockSelection({
  startNode,
  startOffset = 0,
  endNode = startNode,
  endOffset = 0,
  text,
  isCollapsed = false,
}: {
  startNode: Node;
  startOffset?: number;
  endNode?: Node;
  endOffset?: number;
  text?: string;
  isCollapsed?: boolean;
}) {
  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  const selection = {
    isCollapsed,
    rangeCount: 1,
    anchorNode: startNode,
    anchorOffset: startOffset,
    focusNode: endNode,
    focusOffset: endOffset,
    toString: () => text ?? range.toString(),
    getRangeAt: () => range,
  } as unknown as Selection;
  jest.spyOn(window, 'getSelection').mockReturnValue(selection);
  return selection;
}

function rect(left: number, top: number, width: number, height: number) {
  return { left, top, width, height, right: left + width, bottom: top + height } as DOMRect;
}

function stubRects(caretRectFor: (container: Node) => DOMRect, selectionRect: DOMRect) {
  jest.spyOn(Range.prototype, 'getClientRects').mockImplementation(function (this: Range) {
    const rect = this.collapsed ? caretRectFor(this.startContainer) : null;
    const rects = rect && rect.height > 0 ? [rect] : [];
    return { length: rects.length, item: (i: number) => rects[i] ?? null } as DOMRectList;
  });
  jest.spyOn(Range.prototype, 'getBoundingClientRect').mockImplementation(function (this: Range) {
    return this.collapsed ? caretRectFor(this.startContainer) : selectionRect;
  });
}

function showButton(node: Node, endNode?: Node, endOffset?: number) {
  mockSelection({ startNode: node, endNode: endNode ?? node, endOffset: endOffset ?? 0 });
  fireEvent.mouseUp(document.body);
  return screen.getByRole('button', { name: /copy/i });
}

beforeAll(() => {
  Range.prototype.getClientRects = () =>
    ({ length: 0, item: () => null }) as unknown as DOMRectList;
  Range.prototype.getBoundingClientRect = () => rect(0, 0, 0, 0);
});

beforeEach(() => {
  fixture = document.createElement('div');
  document.body.append(fixture);
  writeText = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});

afterEach(() => {
  fixture.remove();
  jest.restoreAllMocks();
});

describe(CodeSelectionCopy, () => {
  it('shows a Copy button above the selection midpoint in a code block', () => {
    renderWithFixture(CODE_BLOCK);
    const code = document.getElementById('code')!.firstChild!;
    stubRects(
      container => (container === code ? rect(100, 200, 0, 16) : rect(300, 240, 0, 16)),
      rect(100, 200, 200, 56)
    );
    mockSelection({ startNode: code, startOffset: 0, endNode: code.parentElement!, endOffset: 1 });
    fireEvent.mouseUp(document.body);

    const button = screen.getByRole('button', { name: 'Copy' });
    expect(button).toHaveStyle({ top: '160px', left: '200px' });
  });

  it('falls back to the selection rect when a caret rect is degenerate', () => {
    renderWithFixture(CODE_BLOCK);
    const code = document.getElementById('code')!.firstChild!;
    stubRects(
      container => (container === code ? rect(0, 0, 0, 0) : rect(350, 420, 0, 16)),
      rect(300, 400, 200, 36)
    );
    mockSelection({ startNode: code, startOffset: 0, endNode: code.parentElement!, endOffset: 1 });
    fireEvent.mouseUp(document.body);

    const button = screen.getByRole('button', { name: 'Copy' });
    expect(button).toHaveStyle({ top: '360px', left: '325px' });
  });

  it('copies the selection without hidden code or placeholders, then flips to Copied!', async () => {
    renderWithFixture(HIDDEN_CODE_BLOCK);
    const code = document.getElementById('code')!;
    const button = showButton(code.firstChild!, code, code.childNodes.length);

    fireEvent.click(button);

    expect(writeText).toHaveBeenCalledWith('visible start\nvisible end');
    expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument();
    await act(
      () =>
        new Promise(resolve => {
          requestAnimationFrame(() => {
            resolve(null);
          });
        })
    );
    expect(screen.getByRole('status')).toHaveTextContent('Copied!');
  });

  it('copies diff selections as clean joined lines without gutters', () => {
    renderWithFixture(DIFF_BLOCK);
    const body = document.getElementById('diff-body')!;
    const button = showButton(body.firstChild!, body, body.childNodes.length);

    fireEvent.click(button);

    expect(writeText).toHaveBeenCalledWith('package com.myapp\nimport expo.modules.Wrapper');
  });

  it('does not appear for selections outside code blocks', () => {
    renderWithFixture(PROSE);
    mockSelection({ startNode: document.getElementById('prose')!.firstChild!, endOffset: 10 });
    fireEvent.mouseUp(document.body);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('does not appear inside data-selection-copy-ignore containers', () => {
    renderWithFixture(`<div data-selection-copy-ignore>${CODE_BLOCK}</div>`);
    const code = document.getElementById('code')!;
    mockSelection({ startNode: code.firstChild!, endNode: code, endOffset: 1 });
    fireEvent.mouseUp(document.body);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('ignores collapsed and whitespace-only selections', () => {
    renderWithFixture(CODE_BLOCK);
    const code = document.getElementById('code')!.firstChild!;

    mockSelection({ startNode: code, isCollapsed: true });
    fireEvent.mouseUp(document.body);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    mockSelection({ startNode: code, text: '  \n  ' });
    fireEvent.mouseUp(document.body);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('survives clicks landing on the SVG icon inside the button', () => {
    renderWithFixture(CODE_BLOCK);
    const code = document.getElementById('code')!;
    const button = showButton(code.firstChild!, code, 1);
    const icon = button.querySelector('svg')!;

    fireEvent.mouseDown(icon);
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();

    fireEvent.click(icon);
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument();
  });

  it('dismisses on Escape', () => {
    renderWithFixture(CODE_BLOCK);
    const code = document.getElementById('code')!;
    showButton(code.firstChild!, code, 1);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('dismisses on mousedown outside the button', () => {
    renderWithFixture(CODE_BLOCK);
    const code = document.getElementById('code')!;
    showButton(code.firstChild!, code, 1);

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('dismisses on scroll and resize', () => {
    renderWithFixture(CODE_BLOCK);
    const code = document.getElementById('code')!;
    showButton(code.firstChild!, code, 1);

    fireEvent.scroll(document.body);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    showButton(code.firstChild!, code, 1);
    fireEvent(window, new Event('resize'));
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
