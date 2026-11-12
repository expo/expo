import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { Image } from '../Image';

const source = { uri: 'https://example.com/image.png' };

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.restoreAllMocks();
});

// The browser's state of every `<img>`: in memory (complete once mounted) or still loading.
function mockImagesInMemory(inMemory: boolean) {
  jest.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(inMemory);
  jest.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(inMemory ? 100 : 0);
}

async function render(element: React.ReactElement) {
  await act(async () => {
    root.render(element);
  });
  return container.querySelector('img')!;
}

describe('Image memory cache hits', () => {
  it('shows an image in memory at once with skipOnCacheHit, and reports it once', async () => {
    mockImagesInMemory(true);
    const onLoad = jest.fn();
    const img = await render(
      <Image
        source={source}
        transition={{ duration: 300, skipOnCacheHit: 'all' }}
        onLoad={onLoad}
      />
    );
    await act(async () => {
      img.dispatchEvent(new Event('load'));
    });

    expect(img.className).toBe('');
    expect(img.style.transitionDuration).toBe('0ms');
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(onLoad.mock.calls[0][0].cacheType).toBe('memory');
  });

  it('still fades an image in memory in without skipOnCacheHit', async () => {
    mockImagesInMemory(true);
    const img = await render(<Image source={source} transition={300} />);

    expect(img.className).toMatch(/cross-dissolve-active/);
  });

  it('still fades in an image that is loading, with skipOnCacheHit', async () => {
    mockImagesInMemory(false);
    const onLoad = jest.fn();
    const img = await render(
      <Image
        source={source}
        transition={{ duration: 300, skipOnCacheHit: 'all' }}
        onLoad={onLoad}
      />
    );

    expect(img.className).toMatch(/cross-dissolve-start/);
    await act(async () => {
      img.dispatchEvent(new Event('load'));
    });
    expect(img.className).toMatch(/cross-dissolve-active/);
    expect(onLoad.mock.calls[0][0].cacheType).toBe('none');
  });
});
