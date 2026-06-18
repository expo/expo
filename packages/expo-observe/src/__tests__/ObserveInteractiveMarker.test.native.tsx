import { render } from '@testing-library/react-native';
import { StrictMode } from 'react';

import { ObserveInteractiveMarker } from '../ObserveInteractiveMarker';
import { useObserve } from '../useObserve';

jest.mock('../useObserve', () => ({
  __esModule: true,
  useObserve: jest.fn(),
}));

const mockUseObserve = useObserve as jest.Mock;
const markInteractive = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockUseObserve.mockReturnValue({ markInteractive });
});

describe(ObserveInteractiveMarker, () => {
  it('calls markInteractive exactly once on first render with the given params', () => {
    render(<ObserveInteractiveMarker params={{ cacheHit: true }} />);

    expect(markInteractive).toHaveBeenCalledTimes(1);
    expect(markInteractive).toHaveBeenCalledWith({ params: { cacheHit: true } });
  });

  it('passes undefined params through when none are provided', () => {
    render(<ObserveInteractiveMarker />);

    expect(markInteractive).toHaveBeenCalledTimes(1);
    expect(markInteractive).toHaveBeenCalledWith({ params: undefined });
  });

  it('calls markInteractive twice under StrictMode double-invoke', () => {
    render(
      <StrictMode>
        <ObserveInteractiveMarker params={{ cacheHit: true }} />
      </StrictMode>
    );

    expect(markInteractive).toHaveBeenCalledTimes(2);
  });

  it('renders null', () => {
    const { toJSON } = render(<ObserveInteractiveMarker params={{ cacheHit: true }} />);

    expect(toJSON()).toBeNull();
  });

  it('does not call markInteractive again when re-rendered with a fresh but equal params object', () => {
    const { rerender } = render(<ObserveInteractiveMarker params={{ cacheHit: true }} />);
    rerender(<ObserveInteractiveMarker params={{ cacheHit: true }} />);

    expect(markInteractive).toHaveBeenCalledTimes(1);
  });

  it('does not call markInteractive again when params change after the first render', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(<ObserveInteractiveMarker params={{ cacheHit: true }} />);
    rerender(<ObserveInteractiveMarker params={{ cacheHit: false }} />);

    expect(markInteractive).toHaveBeenCalledTimes(1);
    expect(markInteractive).toHaveBeenCalledWith({ params: { cacheHit: true } });
    warnSpy.mockRestore();
  });

  it('warns once when params change after the first render', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(<ObserveInteractiveMarker params={{ cacheHit: true }} />);

    rerender(<ObserveInteractiveMarker params={{ cacheHit: false }} />);
    rerender(<ObserveInteractiveMarker params={{ cacheHit: 'other' }} />);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toEqual(
      expect.stringContaining('[expo-observe] <ObserveInteractiveMarker>')
    );
    warnSpy.mockRestore();
  });

  it('does not warn when re-rendered with a fresh but equal params object', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(<ObserveInteractiveMarker params={{ cacheHit: true }} />);

    rerender(<ObserveInteractiveMarker params={{ cacheHit: true }} />);

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('fires again on remount without warning, since the warning is scoped to one lifetime', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const first = render(<ObserveInteractiveMarker params={{ cacheHit: true }} />);
    first.unmount();

    render(<ObserveInteractiveMarker params={{ cacheHit: false }} />);

    expect(markInteractive).toHaveBeenCalledTimes(2);
    expect(markInteractive).toHaveBeenNthCalledWith(1, { params: { cacheHit: true } });
    expect(markInteractive).toHaveBeenNthCalledWith(2, { params: { cacheHit: false } });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
