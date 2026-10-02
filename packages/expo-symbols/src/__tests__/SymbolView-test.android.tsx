import { isHiddenFromAccessibility, render, screen } from '@testing-library/react-native';

import { SymbolView } from '../SymbolView';
import { androidSymbolToString } from '../android';

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
}));

const glyph = androidSymbolToString('chevron_right')!;

describe('SymbolView', () => {
  it('hides the glyph from accessibility', async () => {
    await render(<SymbolView name={{ android: 'chevron_right' }} />);

    expect(screen.getByText(glyph, { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByText(glyph, { includeHiddenElements: false })).toBeNull();
  });

  it('forwards aria-hidden to the rendered view', async () => {
    await render(<SymbolView name={{ android: 'chevron_right' }} testID="symbol" aria-hidden />);

    expect(
      isHiddenFromAccessibility(screen.getByTestId('symbol', { includeHiddenElements: true }))
    ).toBe(true);
  });

  it('forwards aria-label to the rendered view', async () => {
    await render(
      <SymbolView name={{ android: 'chevron_right' }} testID="symbol" aria-label="Next" />
    );

    expect(screen.getByLabelText('Next')).toBe(screen.getByTestId('symbol'));
  });

  it('does not forward symbol props to the rendered view', async () => {
    await render(
      <SymbolView
        name={{ android: 'chevron_right' }}
        testID="symbol"
        type="hierarchical"
        scale="large"
        colors="red"
        resizeMode="center"
        animationSpec={{ effect: { type: 'bounce' } }}
      />
    );

    const { props } = screen.getByTestId('symbol');
    for (const key of ['type', 'scale', 'colors', 'resizeMode', 'animationSpec']) {
      expect(props).not.toHaveProperty(key);
    }
  });

  it('keeps the rendered view from being flattened so its label is not lost', async () => {
    await render(
      <SymbolView name={{ android: 'chevron_right' }} testID="symbol" aria-label="Next" />
    );

    expect(screen.getByTestId('symbol').props.collapsable).toBe(false);
  });
});
