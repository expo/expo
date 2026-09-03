import { renderHook } from '@testing-library/react-native';
import * as React from 'react';
import type { PropsWithChildren } from 'react';

import { unstable_navigationEvents } from '../../navigationEvents';
import type { NavigationState } from '../../react-navigation/routers';
import { PreventRemovalProvider, RemovalPreventionProvider } from '../removalPrevention';
import type { NavigationTreeReport } from '../useNavigationTreeReducer';
import { useNavigationTreeReportEvents } from '../useNavigationTreeReportEvents';

const state: NavigationState = {
  stale: false,
  key: 'root',
  routeKeySeq: 0,
  index: 0,
  routeNames: ['index'],
  routes: [{ key: 'index', name: 'index' }],
};

function wrapper({ children }: PropsWithChildren) {
  return <RemovalPreventionProvider>{children}</RemovalPreventionProvider>;
}

test('emits and consumes only new report events', () => {
  const actions: string[] = [];
  const consumeReportEvents = jest.fn();
  const onUnhandledAction = jest.fn();
  const unsubscribe = unstable_navigationEvents.addListener('actionDispatched', (event) =>
    actions.push(event.actionType)
  );
  const firstEvent = {
    id: 0,
    type: 'action-dispatched' as const,
    action: { type: 'FIRST' },
    state,
  };
  const report: NavigationTreeReport = { events: [firstEvent] };
  const result = renderHook(
    ({ report }: { report: NavigationTreeReport }) =>
      useNavigationTreeReportEvents(report, consumeReportEvents, onUnhandledAction),
    { wrapper, initialProps: { report } }
  );

  result.rerender({
    report: {
      events: [firstEvent, { id: 1, type: 'action-dispatched', action: { type: 'SECOND' }, state }],
    },
  });

  expect(actions).toEqual(['FIRST', 'SECOND']);
  expect(consumeReportEvents).toHaveBeenNthCalledWith(1, [0]);
  expect(consumeReportEvents).toHaveBeenNthCalledWith(2, [1]);
  unsubscribe();
});

test('calls the unhandled action callback and consumes the report event', () => {
  const onUnhandledAction = jest.fn();
  const consumeReportEvents = jest.fn();
  const action = { type: 'UNKNOWN' };
  const report: NavigationTreeReport = {
    events: [{ id: 0, type: 'unhandled-action', action }],
  };

  renderHook(() => useNavigationTreeReportEvents(report, consumeReportEvents, onUnhandledAction), {
    wrapper,
  });

  expect(onUnhandledAction).toHaveBeenCalledWith(action);
  expect(consumeReportEvents).toHaveBeenCalledWith([0]);
});

test('emits removePrevented and removed to the registered route emitters', () => {
  const emitRemovalEvent = jest.fn();
  const consumeReportEvents = jest.fn();
  const onUnhandledAction = jest.fn();
  const action = { type: 'POP' };
  const report: NavigationTreeReport = {
    events: [
      { id: 0, type: 'prevented-routes', routeKeys: ['a'], action },
      { id: 1, type: 'removed-routes', routeKeys: ['a'], action },
    ],
  };

  const result = renderHook(
    ({ report }: { report: NavigationTreeReport | undefined }) =>
      useNavigationTreeReportEvents(report, consumeReportEvents, onUnhandledAction),
    {
      initialProps: { report: undefined },
      wrapper: ({ children }: PropsWithChildren) => (
        <RemovalPreventionProvider>
          <PreventRemovalProvider routeKey="a" emitRemovalEvent={emitRemovalEvent}>
            {children}
          </PreventRemovalProvider>
        </RemovalPreventionProvider>
      ),
    }
  );
  result.rerender({ report });

  expect(emitRemovalEvent).toHaveBeenNthCalledWith(1, 'a', 'removePrevented', action);
  expect(emitRemovalEvent).toHaveBeenNthCalledWith(2, 'a', 'removed', action);
  expect(consumeReportEvents).toHaveBeenCalledWith([0, 1]);
});

test('does not call the unhandled action callback twice in StrictMode', () => {
  const onUnhandledAction = jest.fn();
  const consumeReportEvents = jest.fn();
  const action = { type: 'UNKNOWN' };
  const report: NavigationTreeReport = {
    events: [{ id: 0, type: 'unhandled-action', action }],
  };

  renderHook(() => useNavigationTreeReportEvents(report, consumeReportEvents, onUnhandledAction), {
    wrapper: ({ children }: PropsWithChildren) => (
      <React.StrictMode>
        <RemovalPreventionProvider>{children}</RemovalPreventionProvider>
      </React.StrictMode>
    ),
  });

  expect(onUnhandledAction).toHaveBeenCalledWith(action);
  expect(onUnhandledAction).toHaveBeenCalledTimes(1);
  expect(consumeReportEvents).toHaveBeenCalledTimes(1);
});

test('keeps emitting the remaining events when the unhandled action callback throws', () => {
  const actions: string[] = [];
  const consumeReportEvents = jest.fn();
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const onUnhandledAction = jest.fn(() => {
    throw new Error('listener failed');
  });
  const unsubscribe = unstable_navigationEvents.addListener('actionDispatched', (event) => {
    actions.push(event.actionType);
  });
  const report: NavigationTreeReport = {
    events: [
      { id: 0, type: 'unhandled-action', action: { type: 'UNKNOWN' } },
      { id: 1, type: 'action-dispatched', action: { type: 'SECOND' }, state },
    ],
  };

  renderHook(() => useNavigationTreeReportEvents(report, consumeReportEvents, onUnhandledAction), {
    wrapper,
  });

  expect(onUnhandledAction).toHaveBeenCalledWith({ type: 'UNKNOWN' });
  expect(actions).toEqual(['SECOND']);
  expect(warn).toHaveBeenCalledTimes(1);
  expect(consumeReportEvents).toHaveBeenCalledWith([0, 1]);
  unsubscribe();
  warn.mockRestore();
});
