import type { PropsWithChildren } from 'react';

const mockHydratedId = jest.fn<void, [string]>();

// Each test renders on the server, then hydrates in the browser. The server render must not reuse
// modules that an earlier hydration loaded.
beforeEach(() => {
  jest.resetModules();
});

function loadServer() {
  return require('../server/renderStreamingContent') as typeof import('../server/renderStreamingContent');
}

jest.mock('expo-router/_ctx', () => {
  const { useEffect, useId } = require('react');

  // A label tied to its input with `useId`, as accessible form components do. After hydration,
  // the effect reports the id that React computed in the browser.
  function Index() {
    const id = useId();
    useEffect(() => {
      mockHydratedId(id);
    }, [id]);
    return (
      <main>
        <label htmlFor={id}>Name</label>
        <input id={id} />
      </main>
    );
  }

  const routes = { './index.tsx': { default: Index } };
  return {
    ctx: Object.assign((key: keyof typeof routes) => routes[key], {
      keys: () => Object.keys(routes),
      resolve: (key: string) => key,
      id: 'test-routes',
    }),
  };
});
jest.mock('expo-router/_ctx-html', () => ({
  ctx: { keys: () => [] },
}));
// Metro replaces this module with the pass-through shim in
// `@expo/cli/static/shims/react-native-web/dist/exports/AppRegistry/AppContainer.js`, so `<html>`
// is the root element of the server output. Jest does not apply that shim.
jest.mock('react-native-web/dist/cjs/exports/AppRegistry/AppContainer', () => ({
  __esModule: true,
  default: ({ children }: PropsWithChildren) => children,
}));

type JSDOMConstructor = new (
  html: string,
  options: { url: string }
) => { window: Window & typeof globalThis };

function hydrateLikeTheBrowser(html: string) {
  const { JSDOM } = require('jsdom') as { JSDOM: JSDOMConstructor };
  const dom = new JSDOM(html, { url: 'http://localhost/' });
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  const rootTag = dom.window.document.getElementById('root')!;
  const serverId = rootTag.querySelector('input')!.id;

  // The browser bundle is a module graph of its own. In one registry, the server renderer and the
  // client renderer would share each context object, and React would warn about multiple renderers.
  jest.resetModules();
  const { act } = require('react') as typeof import('react');
  const { hydrateRoot } = require('react-dom/client') as typeof import('react-dom/client');
  const { ExpoRoot } = require('expo-router') as typeof import('expo-router');
  const { ctx } = require('expo-router/_ctx') as typeof import('expo-router/_ctx');
  const { default: Head } = require('expo-router/head') as typeof import('expo-router/head');
  const hydrate = () =>
    act(async () => {
      hydrateRoot(
        rootTag,
        <Head.Provider>
          <ExpoRoot context={ctx} />
        </Head.Provider>
      );
    });
  return { serverId, hydrate };
}

it('server output renders the same useId value as the browser', async () => {
  const stream = await loadServer().getStreamingContent(new URL('http://localhost/'), {
    route: { file: './index.tsx', page: '/index' },
  });
  const html = await new Response(stream).text();
  const { serverId, hydrate } = hydrateLikeTheBrowser(html);
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await hydrate();
    expect(mockHydratedId).toHaveBeenCalledWith(serverId);
    expect(consoleError).not.toHaveBeenCalled();
  } finally {
    consoleError.mockRestore();
  }
});

it('static output renders the same useId value as the browser', async () => {
  const html = await loadServer().getStreamingContent(new URL('http://localhost/'), {
    route: { file: './index.tsx', page: '/index' },
    output: 'static',
  });
  const { serverId, hydrate } = hydrateLikeTheBrowser(html);
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await hydrate();
    expect(mockHydratedId).toHaveBeenCalledWith(serverId);
    expect(consoleError).not.toHaveBeenCalled();
  } finally {
    consoleError.mockRestore();
  }
});
