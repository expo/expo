import { spacing } from '@expo/styleguide-base';
import { render, screen } from '@testing-library/react';

import { getHeadingIndent, getHeadingInfo } from './TableOfContents';

describe(getHeadingIndent, () => {
  const paddingFactor = spacing[2];

  // This shouldn't be included in the table of contents, but it's nice to test anyways
  it('returns no padding for h1 heading', () => {
    expect(getHeadingIndent(makeHeading('h1'))).toHaveProperty('paddingLeft', 0);
  });

  it('returns no padding for h2 heading', () => {
    expect(getHeadingIndent(makeHeading('h2'))).toHaveProperty('paddingLeft', 0);
  });

  it('returns 1x padding for h3 heading', () => {
    expect(getHeadingIndent(makeHeading('h3'))).toHaveProperty('paddingLeft', paddingFactor);
  });

  it('returns 2x padding for h4 heading', () => {
    expect(getHeadingIndent(makeHeading('h4'))).toHaveProperty('paddingLeft', paddingFactor * 2);
  });

  it('returns 3x padding for h5 heading', () => {
    expect(getHeadingIndent(makeHeading('h5'))).toHaveProperty('paddingLeft', paddingFactor * 3);
  });

  it('returns 4x padding for h6 heading', () => {
    expect(getHeadingIndent(makeHeading('h6'))).toHaveProperty('paddingLeft', paddingFactor * 4);
  });
});

describe(getHeadingInfo, () => {
  it('returns normal text from h1 heading', () => {
    expect(getHeadingInfo(makeHeading('h1', 'Hello'))).toMatchObject({
      type: 'text',
      text: 'Hello',
    });
  });

  it('returns normal text from h2 heading', () => {
    expect(getHeadingInfo(makeHeading('h2', 'Hello World'))).toMatchObject({
      type: 'text',
      text: 'Hello World',
    });
  });

  it('returns normal text from h3 heading with platform specification', () => {
    expect(getHeadingInfo(makeHeading('h3', 'Cool stuff (Android only)'))).toMatchObject({
      type: 'text',
      text: 'Cool stuff (Android only)',
    });
  });

  it('returns code text from h4 heading with function name', () => {
    expect(getHeadingInfo(makeHeading('h4', 'getCoolStuffAsync()'))).toMatchObject({
      type: 'code',
      text: 'getCoolStuffAsync',
    });
  });

  it('returns code text from h5 heading with function name and args', () => {
    expect(getHeadingInfo(makeHeading('h5', 'getTransformAsync(input: string)'))).toMatchObject({
      type: 'code',
      text: 'getTransformAsync',
    });
  });

  it('returns code text from h6 heading with function name, args, and return type', () => {
    expect(
      getHeadingInfo(makeHeading('h6', 'getTransformAsync(input: string): Promise<string>'))
    ).toMatchObject({
      type: 'code',
      text: 'getTransformAsync',
    });
  });
});

function makeHeading(Tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', text = 'Hello World') {
  render(<Tag data-testid="heading">{text}</Tag>);
  return screen.getByTestId('heading') as HTMLHeadingElement;
}
