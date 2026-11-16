import { render } from '@testing-library/react-native';
import { View } from 'react-native';

import { ScrollView } from '..';
import { findNativeViewProps, renderedNativeViews } from '../../../__mocks__/expo';

jest.mock('expo');

function nativeViewNames() {
  return renderedNativeViews.mock.calls.map(([name]) => name);
}

describe('ScrollView', () => {
  it('lays out horizontal children in an HStack', async () => {
    await render(
      <ScrollView direction="horizontal" style={{ padding: 8 }}>
        <View />
        <View />
      </ScrollView>
    );

    expect(nativeViewNames()).toContain('HStackView');
    expect(nativeViewNames()).not.toContain('GroupView');
    expect(nativeViewNames()).not.toContain('VStackView');
    expect(findNativeViewProps('ScrollViewComponent')).toEqual(
      expect.objectContaining({ axes: 'horizontal', showsIndicators: true })
    );
    expect(findNativeViewProps('HStackView')).toEqual(
      expect.objectContaining({
        alignment: 'top',
        modifiers: expect.arrayContaining([
          expect.objectContaining({ $type: 'frame', maxWidth: Infinity, alignment: 'topLeading' }),
          expect.objectContaining({ $type: 'padding', all: 8 }),
        ]),
      })
    );
  });

  it('lays out vertical children in a VStack', async () => {
    await render(
      <ScrollView>
        <View />
        <View />
      </ScrollView>
    );

    expect(nativeViewNames()).toContain('VStackView');
    expect(nativeViewNames()).not.toContain('GroupView');
    expect(nativeViewNames()).not.toContain('HStackView');
    expect(findNativeViewProps('ScrollViewComponent')).toEqual(
      expect.objectContaining({ axes: 'vertical' })
    );
    expect(findNativeViewProps('VStackView')).toEqual(
      expect.objectContaining({
        alignment: 'leading',
        modifiers: expect.arrayContaining([
          expect.objectContaining({ $type: 'frame', maxWidth: Infinity, alignment: 'topLeading' }),
        ]),
      })
    );
  });
});
