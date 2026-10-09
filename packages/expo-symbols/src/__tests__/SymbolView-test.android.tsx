import { isHiddenFromAccessibility, render, screen, waitFor } from '@testing-library/react-native';
import { isLoaded, loadAsync } from 'expo-font';

import { SymbolView } from '../SymbolView';
import { androidSymbolToString } from '../android';

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: jest.fn(() => false),
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

  it('draws the glyph when loading rejects but the font face is registered', async () => {
    jest.mocked(loadAsync).mockRejectedValueOnce(new Error('timed out'));
    jest.mocked(isLoaded).mockReturnValueOnce(true);
    await render(<SymbolView name={{ android: 'chevron_right' }} />);

    expect(await screen.findByText(glyph, { includeHiddenElements: true })).toBeTruthy();
  });

  it('draws nothing when loading rejects and the font face is not registered', async () => {
    jest.mocked(loadAsync).mockRejectedValueOnce(new Error('invalid source'));
    jest.mocked(isLoaded).mockClear();
    await render(<SymbolView name={{ android: 'chevron_right' }} />);

    await waitFor(() => expect(isLoaded).toHaveBeenCalled());
    expect(screen.queryByText(glyph, { includeHiddenElements: true })).toBeNull();
  });
});
