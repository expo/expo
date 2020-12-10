import { renderHook } from '@testing-library/react-hooks';

import * as Font from '../Font';
import { useFonts } from '../FontHooks';

describe('useFonts', () => {
  const DATA = 0;
  const ERROR = 1;
  const FONTS = {
    'OpenSans-Regular': 'path/to/font.ttf',
    'ComicSans-Regular': 'path/to/jailed/font.ttf',
  };

  const loadAsyncSpy = jest.spyOn(Font, 'loadAsync').mockResolvedValue();

  it('loads fonts when mounted', async () => {
    const hook = renderHook(() => useFonts(FONTS));

    expect(hook.result.current[DATA]).toBe(false);
    await hook.waitForNextUpdate();
    expect(hook.result.current[DATA]).toBe(true);
  });

  it('skips new font map when rerendered', async () => {
    const hook = renderHook(useFonts, { initialProps: FONTS });
    await hook.waitForNextUpdate();

    expect(loadAsyncSpy).toBeCalledWith(FONTS);

    const partialFonts: Partial<typeof FONTS> = { ...FONTS };
    delete partialFonts['ComicSans-Regular'];

    hook.rerender(partialFonts as typeof FONTS);

    expect(hook.result.current[DATA]).toBe(true);
    expect(loadAsyncSpy).not.toBeCalledWith(partialFonts);
  });

  it('keeps fonts loaded when unmounted', async () => {
    const hook = renderHook(useFonts, { initialProps: FONTS });
    await hook.waitForNextUpdate();

    expect(hook.result.current[DATA]).toBe(true);
    hook.unmount();
    expect(hook.result.current[DATA]).toBe(true);
  });

  it('returns error when encountered', async () => {
    const error = new Error('test');
    loadAsyncSpy.mockRejectedValue(error);

    const hook = renderHook(useFonts, { initialProps: FONTS });

    expect(hook.result.current[ERROR]).toBeNull();
    await hook.waitForNextUpdate();
    expect(hook.result.current[ERROR]).toBe(error);
  });
});
