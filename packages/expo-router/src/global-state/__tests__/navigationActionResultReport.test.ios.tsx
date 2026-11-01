import { renderHook } from '@testing-library/react-native';
import * as React from 'react';

import type { NavigationState } from '../../react-navigation/routers';
import { createNavigationActionResultRegistry } from '../navigationActionResult';
import { RemovalPreventionProvider } from '../removalPrevention';
import type { NavigationTreeReport } from '../useNavigationTreeReducer';
import { useNavigationTreeReportEvents } from '../useNavigationTreeReportEvents';

const state: NavigationState = {
  stale: false,
  key: 'root',
  routeKeySeq: 0,
  index: 0,
  routeNames: ['home'],
  routes: [{ key: 'home', name: 'home' }],
};
const browserHistory = { apply: jest.fn(), listen: jest.fn(() => () => {}) };

function wrapper({ children }: React.PropsWithChildren) {
  return (
    <React.StrictMode>
      <RemovalPreventionProvider>{children}</RemovalPreventionProvider>
    </React.StrictMode>
  );
}

test('post-commit transaction reports settle once under StrictMode and repeated reports', async () => {
  const registry = createNavigationActionResultRegistry();
  const callback = jest.fn();
  const subscription = registry.register(callback);
  const report: NavigationTreeReport = {
    events: [
      {
        id: 1,
        type: 'action-result',
        transactionId: subscription.id,
        result: { status: 'handled', state },
      },
    ],
  };
  const consume = jest.fn();
  const rendered = await renderHook<void, { report: NavigationTreeReport }>(
    ({ report }) => useNavigationTreeReportEvents(report, consume, browserHistory, registry.settle),
    {
      wrapper,
      initialProps: { report },
    }
  );
  await rendered.rerender({ report: { events: [...report.events] } });
  expect(callback).toHaveBeenCalledTimes(1);
  expect(registry.getSnapshot().has(subscription.token)).toBe(false);
});

test('a cancelled observer receives no callback when an already queued report commits', async () => {
  const registry = createNavigationActionResultRegistry();
  const callback = jest.fn();
  const subscription = registry.register(callback);
  subscription.remove();
  const report: NavigationTreeReport = {
    events: [
      {
        id: 1,
        type: 'action-result',
        transactionId: subscription.id,
        result: { status: 'cancelled', state },
      },
    ],
  };
  await renderHook(
    () => useNavigationTreeReportEvents(report, jest.fn(), browserHistory, registry.settle),
    { wrapper }
  );
  expect(callback).not.toHaveBeenCalled();
});
