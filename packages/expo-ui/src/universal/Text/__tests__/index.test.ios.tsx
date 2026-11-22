import { render } from '@testing-library/react-native';

import { Text } from '..';
import { findNativeViewProps } from '../../../__mocks__/expo';
import {
  font,
  foregroundStyle,
  lineLimit,
  lineSpacing,
  opacity,
} from '../../../swift-ui/modifiers';

jest.mock('expo');

function nativeTextModifiers() {
  return findNativeViewProps('TextView')?.modifiers;
}

describe('Text', () => {
  it('maps textStyle.color to a foregroundStyle modifier', async () => {
    await render(<Text textStyle={{ color: 'red' }}>hi</Text>);
    expect(nativeTextModifiers()).toEqual([foregroundStyle('red')]);
  });

  it('does not inject textStyle-derived modifiers the user overrides', async () => {
    await render(
      <Text textStyle={{ color: 'red' }} modifiers={[foregroundStyle('blue')]}>
        hi
      </Text>
    );
    expect(nativeTextModifiers()).toEqual([foregroundStyle('blue')]);
  });

  it('prefers a user lineLimit modifier over numberOfLines', async () => {
    await render(
      <Text numberOfLines={2} modifiers={[lineLimit(5)]}>
        hi
      </Text>
    );
    expect(nativeTextModifiers()).toEqual([lineLimit(5)]);
  });

  it('keeps derived modifiers the user does not override', async () => {
    await render(
      <Text textStyle={{ color: 'red', fontSize: 20 }} modifiers={[opacity(0.5)]}>
        hi
      </Text>
    );
    expect(nativeTextModifiers()).toEqual([
      font({ size: 20, textStyle: 'body' }),
      foregroundStyle('red'),
      opacity(0.5),
    ]);
  });

  it('scales fontSize and lineHeight with the body text style', async () => {
    await render(<Text textStyle={{ fontSize: 12, lineHeight: 20 }}>hi</Text>);
    expect(nativeTextModifiers()).toEqual([
      font({ size: 12, textStyle: 'body' }),
      lineSpacing(8, { textStyle: 'body' }),
    ]);
  });
});
