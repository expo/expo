import { requireOptionalNativeModule } from 'expo';
import type { ExpoAppMetricsModuleType } from 'expo-app-metrics';
import type { ObserveModule, ObserveModuleEvents } from 'expo-observe';
import { Dimensions, PixelRatio } from 'react-native';

import type { ImageModuleEvents, ImageNativeModule } from '../Image.types';
import {
  activate,
  handleImageLoaded,
  initObserveIntegrationIfNeeded,
  initObserveIntegrationIfNeededImpl,
  reportIfOversized,
} from '../observe';
import type { IntegrationState, LoadedImage } from '../observe';

jest.mock('expo', () => ({
  requireOptionalNativeModule: jest.fn(),
}));

const requireNativeModule = requireOptionalNativeModule as unknown as jest.Mock;
let getScreen: jest.SpyInstance;
let getPixelRatio: jest.SpyInstance;

function screenSize(width: number, height: number) {
  return { width, height } as unknown as ReturnType<typeof Dimensions.get>;
}

type MockOf<T> = { [K in keyof T]: jest.Mock };

const CONFIGURE = 'configure' satisfies keyof ObserveModuleEvents;
const IMAGE_LOADED = 'imageLoaded' satisfies keyof ImageModuleEvents;

type FakeObserve = MockOf<Pick<ObserveModule, 'getIntegrations' | 'addListener'>> & {
  emit: (name: string, payload: unknown) => void;
};

type FakeAppMetrics = MockOf<Pick<ExpoAppMetricsModuleType, 'logEvent'>>;

type FakeImageModule = MockOf<Pick<ImageNativeModule, 'addListener'>> & {
  remove: jest.Mock;
  emit: (name: string, payload: unknown) => void;
};

function makeObserve(integrations: Record<string, unknown>): FakeObserve {
  const listeners: Record<string, ((payload: unknown) => void)[]> = {};
  return {
    getIntegrations: jest.fn(() => integrations),
    addListener: jest.fn((name: string, cb: (payload: unknown) => void) => {
      (listeners[name] ??= []).push(cb);
      return { remove: jest.fn() };
    }),
    emit(name, payload) {
      (listeners[name] ?? []).forEach((cb) => cb(payload));
    },
  };
}

function makeAppMetrics(): FakeAppMetrics {
  return { logEvent: jest.fn() };
}

function makeImageModule(): FakeImageModule {
  const listeners: Record<string, ((payload: unknown) => void)[]> = {};
  const remove = jest.fn();
  return {
    remove,
    addListener: jest.fn((name: string, cb: (payload: unknown) => void) => {
      (listeners[name] ??= []).push(cb);
      return { remove };
    }),
    emit(name, payload) {
      (listeners[name] ?? []).forEach((cb) => cb(payload));
    },
  };
}

function mockNativeModules({
  observe = null,
  appMetrics = null,
  imageModule = null,
}: {
  observe?: FakeObserve | null;
  appMetrics?: FakeAppMetrics | null;
  imageModule?: FakeImageModule | null;
}) {
  requireNativeModule.mockImplementation((name: string) =>
    name === 'ExpoObserve' ? observe : name === 'ExpoImage' ? imageModule : appMetrics
  );
}

beforeEach(() => {
  getScreen = jest.spyOn(Dimensions, 'get').mockReturnValue(screenSize(100, 100));
  getPixelRatio = jest.spyOn(PixelRatio, 'get').mockReturnValue(1);
  requireNativeModule.mockReset();
  requireNativeModule.mockReturnValue(null);
});

afterEach(() => jest.restoreAllMocks());

function state(
  over: Partial<{
    enabled: boolean;
    threshold: number;
    includeUrlParams: boolean;
    reported: Set<string>;
    subscription: { remove: () => void } | null;
    appMetrics: FakeAppMetrics | null;
    imageModule: FakeImageModule | null;
  }> = {}
): IntegrationState {
  return {
    enabled: true,
    threshold: 2,
    includeUrlParams: false,
    reported: new Set<string>(),
    subscription: null,
    appMetrics: makeAppMetrics(),
    imageModule: makeImageModule(),
    ...over,
  } as unknown as IntegrationState;
}

function image(
  width: number,
  height = width,
  url = 'https://example.com/a.png',
  pixelRatio = 1
): LoadedImage {
  return { url, width, height, screenWidth: 100, screenHeight: 100, pixelRatio };
}

describe('reportIfOversized', () => {
  it('logs a warning once when the image area exceeds the screen budget times the ratio', () => {
    const appMetrics = makeAppMetrics();

    // budget 10000 × ratio 3 = 30000; 200×200 = 40000 > 30000
    reportIfOversized(
      state({ threshold: 3, appMetrics }),
      image(200, 200, 'https://example.com/a.png', 1)
    );

    expect(appMetrics.logEvent).toHaveBeenCalledTimes(1);
    const [name, options] = appMetrics.logEvent.mock.calls[0];
    expect(name).toBe('expo-image.oversized');
    expect(options.displayName).toBe('Oversized image loaded');
    expect(options.severity).toBe('warn');
    expect(options.attributes).toMatchObject({
      url: 'https://example.com/a.png',
      imageWidth: 200,
      imageHeight: 200,
      screenWidth: 100,
      screenHeight: 100,
      pixelRatio: 1,
    });
  });

  it('does not log when the image area is within the budget', () => {
    const appMetrics = makeAppMetrics();

    // budget 10000 × ratio 3 = 30000; 150×150 = 22500 < 30000
    reportIfOversized(state({ threshold: 3, appMetrics }), image(150));

    expect(appMetrics.logEvent).not.toHaveBeenCalled();
  });

  it('squares the device pixel ratio in the budget', () => {
    const appMetrics = makeAppMetrics();
    const s = state({ threshold: 2, appMetrics });

    // screen 100×100 @3x → budget 100*100*3*3 = 90000; ratio 2 → 180000
    reportIfOversized(s, image(400, 400, 'https://example.com/a.png', 3)); // 160000 < 180000
    expect(appMetrics.logEvent).not.toHaveBeenCalled();

    reportIfOversized(s, image(450, 450, 'https://example.com/b.png', 3)); // 202500 > 180000
    expect(appMetrics.logEvent).toHaveBeenCalledTimes(1);
  });

  it('does not log when the integration is not enabled', () => {
    const appMetrics = makeAppMetrics();

    reportIfOversized(state({ enabled: false, appMetrics }), image(1000));

    expect(appMetrics.logEvent).not.toHaveBeenCalled();
  });

  it('reports each source url at most once', () => {
    const appMetrics = makeAppMetrics();
    const s = state({ threshold: 2, appMetrics });

    reportIfOversized(s, image(1000));
    reportIfOversized(s, image(1000));

    expect(appMetrics.logEvent).toHaveBeenCalledTimes(1);
  });

  it('reports distinct oversized urls independently', () => {
    const appMetrics = makeAppMetrics();
    const s = state({ threshold: 2, appMetrics });

    reportIfOversized(s, image(1000, 1000, 'https://example.com/a.png'));
    reportIfOversized(s, image(1000, 1000, 'https://example.com/b.png'));

    expect(appMetrics.logEvent).toHaveBeenCalledTimes(2);
  });

  it('does not log when the area exactly equals the budget times the ratio', () => {
    const appMetrics = makeAppMetrics();

    // budget 10000 × ratio 2 = 20000; 200×100 = 20000 — strictly greater is required
    reportIfOversized(state({ threshold: 2, appMetrics }), image(200, 100));

    expect(appMetrics.logEvent).not.toHaveBeenCalled();
  });

  it('does not log or throw when the image has no measurable size', () => {
    const appMetrics = makeAppMetrics();

    expect(() => reportIfOversized(state({ appMetrics }), image(0))).not.toThrow();
    expect(appMetrics.logEvent).not.toHaveBeenCalled();
  });

  it('is a no-op when app-metrics is not installed', () => {
    expect(() => reportIfOversized(state({ appMetrics: null }), image(1000))).not.toThrow();
  });

  it('strips the query and fragment from the reported url by default', () => {
    const appMetrics = makeAppMetrics();

    reportIfOversized(
      state({ appMetrics }),
      image(1000, 1000, 'https://example.com/a.png?token=secret#frag')
    );

    expect(appMetrics.logEvent).toHaveBeenCalledTimes(1);
    expect(appMetrics.logEvent.mock.calls[0][1].attributes.url).toBe('https://example.com/a.png');
  });

  it('dedups on the stripped url so signed variants of one image report once', () => {
    const appMetrics = makeAppMetrics();
    const s = state({ appMetrics });

    reportIfOversized(s, image(1000, 1000, 'https://example.com/a.png?token=1'));
    reportIfOversized(s, image(1000, 1000, 'https://example.com/a.png?token=2'));

    expect(appMetrics.logEvent).toHaveBeenCalledTimes(1);
  });

  it('reports the full url when includeUrlParams is enabled', () => {
    const appMetrics = makeAppMetrics();
    const s = state({ appMetrics, includeUrlParams: true });

    reportIfOversized(s, image(1000, 1000, 'https://example.com/a.png?w=4000'));

    expect(appMetrics.logEvent.mock.calls[0][1].attributes.url).toBe(
      'https://example.com/a.png?w=4000'
    );
  });

  it('dedups on the full url when includeUrlParams is enabled', () => {
    const appMetrics = makeAppMetrics();
    const s = state({ appMetrics, includeUrlParams: true });

    reportIfOversized(s, image(1000, 1000, 'https://example.com/a.png?id=1'));
    reportIfOversized(s, image(1000, 1000, 'https://example.com/a.png?id=2'));

    expect(appMetrics.logEvent).toHaveBeenCalledTimes(2);
  });

  it('reports file: urls', () => {
    const appMetrics = makeAppMetrics();

    reportIfOversized(state({ appMetrics }), image(1000, 1000, 'file:///var/app/assets/hero.png'));

    expect(appMetrics.logEvent.mock.calls[0][1].attributes.url).toBe(
      'file:///var/app/assets/hero.png'
    );
  });

  it('reports bundled android.resource: urls', () => {
    const appMetrics = makeAppMetrics();

    reportIfOversized(
      state({ appMetrics }),
      image(1000, 1000, 'android.resource://com.example.app/2131165280')
    );

    expect(appMetrics.logEvent.mock.calls[0][1].attributes.url).toBe(
      'android.resource://com.example.app/2131165280'
    );
  });

  it('never reports urls outside the http, https, file, and android.resource schemes', () => {
    const appMetrics = makeAppMetrics();
    const s = state({ appMetrics });

    reportIfOversized(s, image(1000, 1000, 'ph://ED7AC36B-A150-4C38-BB8C-B6D696F4F2ED/L0/001'));
    reportIfOversized(s, image(1000, 1000, 'content://media/external/images/media/12'));

    expect(appMetrics.logEvent).not.toHaveBeenCalled();
  });

  it('never reports data: urls', () => {
    const appMetrics = makeAppMetrics();

    reportIfOversized(state({ appMetrics }), image(1000, 1000, 'data:image/png;base64,aGVsbG8='));

    expect(appMetrics.logEvent).not.toHaveBeenCalled();
  });

  it('never reports data: urls even when includeUrlParams is enabled', () => {
    const appMetrics = makeAppMetrics();
    const s = state({ appMetrics, includeUrlParams: true });

    reportIfOversized(s, image(1000, 1000, 'data:image/png;base64,aGVsbG8='));

    expect(appMetrics.logEvent).not.toHaveBeenCalled();
  });

  it('strips basic-auth credentials from the reported url', () => {
    const appMetrics = makeAppMetrics();

    reportIfOversized(
      state({ appMetrics }),
      image(1000, 1000, 'https://user:pass@example.com/a.png?token=1')
    );

    expect(appMetrics.logEvent.mock.calls[0][1].attributes.url).toBe('https://example.com/a.png');
  });

  it('strips credentials that contain an unencoded @', () => {
    const appMetrics = makeAppMetrics();

    reportIfOversized(
      state({ appMetrics }),
      image(1000, 1000, 'https://user:pa@ss@example.com/a.png')
    );

    expect(appMetrics.logEvent.mock.calls[0][1].attributes.url).toBe('https://example.com/a.png');
  });

  it('strips credentials even when includeUrlParams is enabled', () => {
    const appMetrics = makeAppMetrics();
    const s = state({ appMetrics, includeUrlParams: true });

    reportIfOversized(s, image(1000, 1000, 'https://user:pass@example.com/a.png?w=4000'));

    expect(appMetrics.logEvent.mock.calls[0][1].attributes.url).toBe(
      'https://example.com/a.png?w=4000'
    );
  });

  it('keeps an @ that is part of the path or query', () => {
    const appMetrics = makeAppMetrics();
    const s = state({ appMetrics, includeUrlParams: true });

    reportIfOversized(s, image(1000, 1000, 'https://example.com/img@2x.png'));
    reportIfOversized(s, image(1000, 1000, 'https://example.com?email=a@b.com'));

    expect(appMetrics.logEvent.mock.calls[0][1].attributes.url).toBe(
      'https://example.com/img@2x.png'
    );
    expect(appMetrics.logEvent.mock.calls[1][1].attributes.url).toBe(
      'https://example.com?email=a@b.com'
    );
  });

  it('does not throw when logEvent fails', () => {
    const appMetrics: FakeAppMetrics = {
      logEvent: jest.fn(() => {
        throw new Error('logEvent failed');
      }),
    };
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() => reportIfOversized(state({ appMetrics }), image(1000))).not.toThrow();
    expect(warn).toHaveBeenCalled();
  });
});

describe('handleImageLoaded', () => {
  it('pairs the loaded image with the current screen size and forwards it to report', () => {
    getScreen.mockReturnValue(screenSize(120, 240));
    getPixelRatio.mockReturnValue(3);
    const report = jest.fn();
    const s = state();

    handleImageLoaded(s, { url: 'https://example.com/a.png', width: 300, height: 300 }, report);

    expect(report).toHaveBeenCalledWith(s, {
      url: 'https://example.com/a.png',
      width: 300,
      height: 300,
      screenWidth: 120,
      screenHeight: 240,
      pixelRatio: 3,
    });
  });
});

describe('activate', () => {
  it('enables and subscribes, reading the oversize threshold from an object config', () => {
    const imageModule = makeImageModule();
    const s = state({ enabled: false, imageModule });

    activate(s, { 'expo-image': { oversizeThreshold: 3 } });

    expect(s.enabled).toBe(true);
    expect(s.threshold).toBe(3);
    expect(s.subscription).not.toBeNull();
    expect(imageModule.addListener).toHaveBeenCalledWith(IMAGE_LOADED, expect.any(Function));
  });

  it('uses the default oversize threshold of 1.5 when enabled with `true`', () => {
    const s = state({ enabled: false });

    activate(s, { 'expo-image': true });

    expect(s.enabled).toBe(true);
    expect(s.threshold).toBe(1.5);
  });

  it('keeps url params disabled by default', () => {
    const s = state({ enabled: false, includeUrlParams: true });

    activate(s, { 'expo-image': true });
    expect(s.includeUrlParams).toBe(false);

    activate(s, { 'expo-image': { oversizeThreshold: 3 } });
    expect(s.includeUrlParams).toBe(false);
  });

  it('reads includeUrlParams from an object config', () => {
    const s = state({ enabled: false });

    activate(s, { 'expo-image': { includeUrlParams: true } });

    expect(s.includeUrlParams).toBe(true);
  });

  it('does not enable or subscribe when the config is absent', () => {
    const imageModule = makeImageModule();
    const s = state({ enabled: false, imageModule });

    activate(s, {});

    expect(s.enabled).toBe(false);
    expect(imageModule.addListener).not.toHaveBeenCalled();
  });

  it('does not enable when disabled with `false`', () => {
    const s = state({ enabled: false });

    activate(s, { 'expo-image': false });

    expect(s.enabled).toBe(false);
  });

  it('resets the dedup set so a previously reported url can report again', () => {
    const reported = new Set(['https://example.com/a.png']);
    const s = state({ reported });

    activate(s, { 'expo-image': true });

    expect(s.reported.size).toBe(0);
    expect(s.reported).not.toBe(reported);
  });

  it('subscribes only once across repeated enabling configures', () => {
    const imageModule = makeImageModule();
    const s = state({ enabled: false, imageModule });

    activate(s, { 'expo-image': true });
    activate(s, { 'expo-image': { oversizeThreshold: 4 } });

    expect(imageModule.addListener).toHaveBeenCalledTimes(1);
    expect(s.threshold).toBe(4);
  });

  it('unsubscribes when a later configure disables the integration', () => {
    const remove = jest.fn();
    const s = state({ enabled: true, subscription: { remove } });

    activate(s, {});

    expect(remove).toHaveBeenCalledTimes(1);
    expect(s.subscription).toBeNull();
  });

  it('re-subscribes after being disabled and enabled again', () => {
    const imageModule = makeImageModule();
    const s = state({ enabled: false, imageModule });

    activate(s, { 'expo-image': true });
    activate(s, {});
    activate(s, { 'expo-image': true });

    expect(imageModule.addListener).toHaveBeenCalledTimes(2);
  });

  it('routes a native imageLoaded event to the injected handler', () => {
    const imageModule = makeImageModule();
    const handle = jest.fn();
    const s = state({ enabled: false, imageModule });

    activate(s, { 'expo-image': true }, handle);
    imageModule.emit(IMAGE_LOADED, { url: 'https://example.com/a.png', width: 1, height: 1 });

    expect(handle).toHaveBeenCalledWith(s, {
      url: 'https://example.com/a.png',
      width: 1,
      height: 1,
    });
  });

  it('routes a native imageLoaded event through the default handler to logEvent', () => {
    // screen 100×100pt @1x → budget 10000; default ratio 1.5 → 15000
    const appMetrics = makeAppMetrics();
    const imageModule = makeImageModule();
    const s = state({ enabled: false, appMetrics, imageModule });

    activate(s, { 'expo-image': true });
    imageModule.emit(IMAGE_LOADED, {
      url: 'https://example.com/big.png',
      width: 300,
      height: 300,
    });

    expect(appMetrics.logEvent).toHaveBeenCalledTimes(1);
    expect(appMetrics.logEvent.mock.calls[0][1].attributes).toMatchObject({
      url: 'https://example.com/big.png',
      imageWidth: 300,
      imageHeight: 300,
      screenWidth: 100,
      screenHeight: 100,
      pixelRatio: 1,
    });
  });
});

describe('initObserveIntegrationIfNeededImpl', () => {
  it('activates with the current integrations on load', () => {
    const observe = makeObserve({ 'expo-image': { oversizeThreshold: 3 } });
    mockNativeModules({ observe });
    const activateSpy = jest.fn();

    initObserveIntegrationIfNeededImpl(activateSpy);

    expect(activateSpy).toHaveBeenCalledTimes(1);
    expect(activateSpy.mock.calls[0][1]).toEqual({ 'expo-image': { oversizeThreshold: 3 } });
  });

  it('re-activates on each later configure event', () => {
    const observe = makeObserve({});
    mockNativeModules({ observe });
    const activateSpy = jest.fn();

    initObserveIntegrationIfNeededImpl(activateSpy);
    observe.emit(CONFIGURE, { integrations: { 'expo-image': { oversizeThreshold: 2 } } });

    expect(activateSpy).toHaveBeenCalledTimes(2);
    expect(activateSpy.mock.calls[1][1]).toEqual({ 'expo-image': { oversizeThreshold: 2 } });
  });

  it('passes the same state object to every activate call', () => {
    const observe = makeObserve({});
    mockNativeModules({ observe });
    const activateSpy = jest.fn();

    initObserveIntegrationIfNeededImpl(activateSpy);
    observe.emit(CONFIGURE, { integrations: { 'expo-image': true } });

    expect(activateSpy.mock.calls[1][0]).toBe(activateSpy.mock.calls[0][0]);
  });

  it('resolves and threads the native modules into state', () => {
    const observe = makeObserve({ 'expo-image': true });
    const appMetrics = makeAppMetrics();
    const imageModule = makeImageModule();
    mockNativeModules({ observe, appMetrics, imageModule });
    const activateSpy = jest.fn();

    initObserveIntegrationIfNeededImpl(activateSpy);

    const passedState = activateSpy.mock.calls[0][0];
    expect(passedState.appMetrics).toBe(appMetrics);
    expect(passedState.imageModule).toBe(imageModule);
  });

  it('is a no-op when expo-observe is not installed', () => {
    // `requireNativeModule` resolves to `null` by default (see `beforeEach`).
    const activateSpy = jest.fn();

    initObserveIntegrationIfNeededImpl(activateSpy);

    expect(activateSpy).not.toHaveBeenCalled();
  });
});

describe('initObserveIntegrationIfNeeded', () => {
  it('runs the impl at most once across repeated calls', () => {
    const observe = makeObserve({ 'expo-image': true });
    mockNativeModules({ observe, appMetrics: makeAppMetrics(), imageModule: makeImageModule() });

    initObserveIntegrationIfNeeded();
    initObserveIntegrationIfNeeded();

    expect(observe.getIntegrations).toHaveBeenCalledTimes(1);
  });
});
