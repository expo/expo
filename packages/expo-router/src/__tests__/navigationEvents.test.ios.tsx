import { Text } from 'react-native';

import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import { unstable_navigationEvents, internal_navigationEventEmitter } from '../navigationEvents';
import { act, renderRouter, screen } from '../testing-library';

describe('unstable_navigationEvents', () => {
  let areNavigationEventsEnabledSpy: jest.SpyInstance;

  beforeEach(() => {
    areNavigationEventsEnabledSpy = jest
      .spyOn(require('../navigationEvents'), 'areNavigationEventsEnabled')
      .mockReturnValue(true);
  });
  afterEach(() => {
    internal_navigationEventEmitter.removeAllListeners('pageWillRender');
    internal_navigationEventEmitter.removeAllListeners('pageFocused');
    internal_navigationEventEmitter.removeAllListeners('pageBlurred');
    internal_navigationEventEmitter.removeAllListeners('pageRemoved');
    jest.restoreAllMocks();
  });

  it('fires pageWillRender on first render when enabled', () => {
    const handler = jest.fn();
    unstable_navigationEvents.addListener('pageWillRender', handler);

    renderRouter({
      _layout: () => <Stack />,
      index: () => <Text testID="index">Index</Text>,
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/__root/index', screenId: expect.any(String) })
    );
  });

  it('does not fire pageWillRender on first render when disabled', () => {
    areNavigationEventsEnabledSpy.mockReturnValue(false);
    const handler = jest.fn();
    unstable_navigationEvents.addListener('pageWillRender', handler);

    renderRouter({
      _layout: () => <Stack />,
      index: () => <Text testID="index">Index</Text>,
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('fires pageWillRender, pageFocused, pageBlurred and pageRemoved during navigation', () => {
    const willRender = jest.fn();
    const focused = jest.fn();
    const blurred = jest.fn();
    const removed = jest.fn();

    unstable_navigationEvents.addListener('pageWillRender', willRender);
    unstable_navigationEvents.addListener('pageFocused', focused);
    unstable_navigationEvents.addListener('pageBlurred', blurred);
    unstable_navigationEvents.addListener('pageRemoved', removed);

    renderRouter({
      _layout: () => <Stack />,
      index: () => <Text testID="index">Index</Text>,
      second: () => <Text testID="second">Second</Text>,
    });

    expect(willRender).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/__root/index', screenId: expect.any(String) })
    );

    willRender.mockClear();
    focused.mockClear();
    blurred.mockClear();
    removed.mockClear();

    act(() => {
      router.push('/second');
    });
    expect(screen.getByTestId('second')).toBeVisible();

    expect(willRender).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/__root/second' })
    );
    expect(focused).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/__root/second' }));
    expect(blurred).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/__root/index' }));

    act(() => {
      router.back();
    });

    expect(removed).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/__root/second' }));
    expect(focused).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/__root/index' }));
  });

  it('fires events for nested param route', () => {
    const willRender = jest.fn();
    const focused = jest.fn();
    const blurred = jest.fn();
    const removed = jest.fn();

    unstable_navigationEvents.addListener('pageWillRender', willRender);
    unstable_navigationEvents.addListener('pageFocused', focused);
    unstable_navigationEvents.addListener('pageBlurred', blurred);
    unstable_navigationEvents.addListener('pageRemoved', removed);

    renderRouter({
      _layout: () => <Stack />,
      index: () => <Text testID="index">Index</Text>,
      'users/_layout': () => <Stack />,
      'users/[id]': () => <Text testID="user">User</Text>,
    });

    jest.clearAllMocks();

    act(() => {
      router.push('/users/123');
    });
    expect(screen.getByTestId('user')).toBeVisible();

    expect(willRender).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/__root/users/[id]?id=123' })
    );
    expect(focused).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/__root/users/[id]?id=123' })
    );
    expect(blurred).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/__root/index' }));

    jest.clearAllMocks();

    act(() => {
      router.back();
    });

    expect(removed).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/__root/users/[id]?id=123' })
    );
    expect(focused).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/__root/index' }));
  });

  it('subscription.remove and removeListener stop receiving events', () => {
    const handler = jest.fn();
    const sub = unstable_navigationEvents.addListener('pageWillRender', handler);
    sub.remove();

    renderRouter({
      _layout: () => <Stack />,
      index: () => <Text testID="index">Index</Text>,
      second: () => <Text testID="second">Second</Text>,
    });

    act(() => {
      router.push('/second');
    });

    expect(handler).not.toHaveBeenCalled();

    const handler2 = jest.fn();
    unstable_navigationEvents.addListener('pageWillRender', handler2);
    unstable_navigationEvents.removeListener('pageWillRender', handler2);

    act(() => {
      router.push('/third');
    });

    expect(handler2).not.toHaveBeenCalled();
  });
});
