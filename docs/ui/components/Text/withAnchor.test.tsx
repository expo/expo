import React from 'react';

import { getTextFromChildren } from './withAnchor';

describe(getTextFromChildren, () => {
  it('returns simple child text', () => {
    expect(getTextFromChildren('Hello')).toBe('Hello');
  });

  it('returns text from child element', () => {
    expect(getTextFromChildren(<span>Hello</span>)).toBe('Hello');
  });

  it('returns text from multiple child elements', () => {
    expect(
      getTextFromChildren(
        <>
          <span>Hello</span>
          <span>World</span>
        </>
      )
    ).toBe('Hello World');
  });
});
