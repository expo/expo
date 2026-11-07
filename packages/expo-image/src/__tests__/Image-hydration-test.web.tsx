import { act, type ReactElement } from 'react';
import { createRoot, hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';

import { Image } from '../Image';

const source = { uri: 'https://example.com/image.png' };

let container: HTMLDivElement;
let root: Root | undefined;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  container.remove();
});

// Renders the element on the server, then hydrates its HTML. `beforeHydrate` can set the state
// the browser gave the server's `<img>` meanwhile (loaded, failed).
async function hydrate(element: ReactElement, beforeHydrate?: (img: HTMLImageElement) => void) {
  container.innerHTML = renderToString(element);
  const img = container.querySelector('img')!;
  beforeHydrate?.(img);
  const errors: unknown[] = [];
  await act(async () => {
    root = hydrateRoot(container, element, { onRecoverableError: (error) => errors.push(error) });
  });
  return { img, errors };
}

function setImageState(img: HTMLImageElement, naturalWidth: number) {
  Object.defineProperty(img, 'complete', { value: true });
  Object.defineProperty(img, 'naturalWidth', { value: naturalWidth });
}

describe('Image hydration', () => {
  it('keeps a server rendered image shown while hydrating, with a transition', async () => {
    const { img, errors } = await hydrate(<Image source={source} transition={300} />);

    expect(errors).toEqual([]);
    expect(img.isConnected).toBe(true);
    expect(img.getAttribute('src')).toBe(source.uri);
    expect(img.className).not.toMatch(/cross-dissolve-start/);
  });

  it('still fades in an image rendered in the browser, with a transition', async () => {
    root = createRoot(container);
    await act(async () => {
      root!.render(<Image source={source} transition={300} />);
    });

    expect(container.querySelector('img')?.className).toMatch(/cross-dissolve-start/);
  });

  it('calls onLoad for a server rendered image loaded before hydrating', async () => {
    const onLoad = jest.fn();
    await hydrate(<Image source={source} onLoad={onLoad} />, (img) => setImageState(img, 100));

    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('calls onError for a server rendered image that failed before hydrating', async () => {
    const onError = jest.fn();
    await hydrate(<Image source={source} onError={onError} />, (img) => setImageState(img, 0));

    expect(onError).toHaveBeenCalledTimes(1);
  });
});
