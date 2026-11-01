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

  it('keeps the glyph at its size regardless of the system font size', async () => {
    await render(<SymbolView name={{ android: 'chevron_right' }} size={20} />);

    const text = screen.getByText(glyph, { includeHiddenElements: true });
    expect(text.props.allowFontScaling).toBe(false);
    expect(text.props.style).toMatchObject({ fontSize: 20, lineHeight: 20 });
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
