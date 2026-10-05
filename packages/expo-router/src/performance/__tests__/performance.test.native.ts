import type * as PerformanceModule from '..';
import type { RouterActionDispatchedMark } from '../types';

const pageDetail = { pathname: '/a', params: {}, segments: ['a'], screenId: 'a-1' };

let api: typeof PerformanceModule;

beforeEach(() => {
  // Each test starts from a disabled, empty store.
  jest.isolateModules(() => {
    api = require('..');
  });
});

function observe(buffered?: boolean) {
  const entries: PerformanceEntry[] = [];
  const observer = new api.unstable_PerformanceObserver((list) => {
    entries.push(...list.getEntries());
  });
  observer.observe({ type: 'mark', buffered });
  return { entries, observer };
}

it('records nothing before unstable_enablePerformanceIntegration()', () => {
  const { entries } = observe();
  api.mark('expo-router:page-focused', pageDetail);

  expect(entries).toEqual([]);
  expect(api.unstable_performance.getEntries()).toEqual([]);
});

it('delivers marks to observers synchronously with startTime and detail', () => {
  jest.spyOn(performance, 'now').mockReturnValue(42);
  api.unstable_enablePerformanceIntegration();
  const actionTypes: string[] = [];
  const observer = new api.unstable_PerformanceObserver((list) => {
    for (const entry of list.getEntriesByName('expo-router:action-dispatched')) {
      // Entries with this name are always action-dispatched marks.
      actionTypes.push((entry as RouterActionDispatchedMark).detail.actionType);
    }
  });
  observer.observe({ type: 'mark' });

  api.mark('expo-router:action-dispatched', { actionType: 'NAVIGATE' });

  expect(actionTypes).toEqual(['NAVIGATE']);
  expect(api.unstable_performance.getEntriesByType('mark').map((entry) => entry.toJSON())).toEqual(
    [
      {
        entryType: 'mark',
        name: 'expo-router:action-dispatched',
        startTime: 42,
        duration: 0,
        detail: { actionType: 'NAVIGATE' },
      },
    ]
  );
});

it('passes the observer itself as the second callback argument', () => {
  api.unstable_enablePerformanceIntegration();
  const observers: PerformanceObserver[] = [];
  const observer = new api.unstable_PerformanceObserver((_list, observer) => {
    observers.push(observer);
  });
  observer.observe({ type: 'mark' });

  api.mark('expo-router:page-focused', pageDetail);

  expect(observers).toEqual([observer]);
});

it('observes marks with entryTypes and ignores other entry types', () => {
  api.unstable_enablePerformanceIntegration();
  const onMarks = jest.fn();
  const onMeasures = jest.fn();
  new api.unstable_PerformanceObserver(onMarks).observe({ entryTypes: ['mark'] });
  new api.unstable_PerformanceObserver(onMeasures).observe({ type: 'measure' });

  api.mark('expo-router:page-focused', pageDetail);

  expect(onMarks).toHaveBeenCalledTimes(1);
  expect(onMeasures).not.toHaveBeenCalled();
});

it('replays earlier entries to a buffered observer', () => {
  api.unstable_enablePerformanceIntegration();
  api.mark('expo-router:page-preloaded', pageDetail);

  const unbuffered = observe();
  const buffered = observe(true);

  expect(unbuffered.entries).toEqual([]);
  expect(buffered.entries.map((entry) => entry.name)).toEqual(['expo-router:page-preloaded']);
});

it('stops delivery after disconnect()', () => {
  api.unstable_enablePerformanceIntegration();
  const { entries, observer } = observe();

  observer.disconnect();
  api.mark('expo-router:page-blurred', pageDetail);

  expect(entries).toEqual([]);
});

it('drops the oldest entries above the buffer cap', () => {
  api.unstable_enablePerformanceIntegration();
  for (let i = 0; i < 251; i++) {
    api.mark('expo-router:action-dispatched', { actionType: `ACTION_${i}` });
  }

  const entries = api.unstable_performance.getEntriesByName('expo-router:action-dispatched');
  expect(entries).toHaveLength(250);
  // Entries with this name are always action-dispatched marks.
  expect((entries[0] as RouterActionDispatchedMark).detail.actionType).toBe('ACTION_1');
});

it('clears marks by name or all marks', () => {
  api.unstable_enablePerformanceIntegration();
  api.mark('expo-router:page-focused', pageDetail);
  api.mark('expo-router:page-removed', pageDetail);

  api.unstable_performance.clearMarks('expo-router:page-focused');
  expect(api.unstable_performance.getEntries().map((entry) => entry.name)).toEqual([
    'expo-router:page-removed',
  ]);

  api.unstable_performance.clearMarks();
  expect(api.unstable_performance.getEntries()).toEqual([]);
});

describe('global performance.mark mirror', () => {
  const originalMark = performance.mark;
  afterEach(() => {
    performance.mark = originalMark;
  });

  it('mirrors each mark with its name, detail, and startTime', () => {
    // The RN Jest preset has no `performance.mark`, so assign the spy directly.
    const markSpy = jest.fn();
    performance.mark = markSpy;
    api.unstable_enablePerformanceIntegration();

    api.mark('expo-router:page-focused', pageDetail);

    expect(markSpy).toHaveBeenCalledWith('expo-router:page-focused', {
      detail: pageDetail,
      startTime: api.unstable_performance.getEntries()[0]?.startTime,
    });
  });
});

it('keeps delivering to other observers when one throws', () => {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  api.unstable_enablePerformanceIntegration();
  const error = new Error('observer failed');
  new api.unstable_PerformanceObserver(() => {
    throw error;
  }).observe({ type: 'mark' });
  const { entries } = observe();

  api.mark('expo-router:page-focused', pageDetail);

  expect(entries.map((entry) => entry.name)).toEqual(['expo-router:page-focused']);
  expect(errorSpy).toHaveBeenCalledWith(expect.any(String), error);
  errorSpy.mockRestore();
});

it('returns no entries for a type other than mark', () => {
  api.unstable_enablePerformanceIntegration();
  api.mark('expo-router:page-focused', pageDetail);
  const lists: PerformanceObserverEntryList[] = [];
  new api.unstable_PerformanceObserver((list) => lists.push(list)).observe({
    type: 'mark',
    buffered: true,
  });

  expect(api.unstable_performance.getEntriesByType('measure')).toEqual([]);
  expect(api.unstable_performance.getEntriesByName('expo-router:page-focused', 'measure')).toEqual(
    []
  );
  expect(lists[0]?.getEntriesByType('measure')).toEqual([]);
  expect(lists[0]?.getEntriesByType('mark')).toHaveLength(1);
});

it('reports a buffered replay callback that throws instead of throwing from observe()', () => {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  api.unstable_enablePerformanceIntegration();
  api.mark('expo-router:page-focused', pageDetail);
  const error = new Error('observer failed');
  const observer = new api.unstable_PerformanceObserver(() => {
    throw error;
  });

  expect(() => observer.observe({ type: 'mark', buffered: true })).not.toThrow();
  expect(errorSpy).toHaveBeenCalledWith(expect.any(String), error);
  errorSpy.mockRestore();
});

it('gives a buffered replay callback a list that later marks do not change', () => {
  api.unstable_enablePerformanceIntegration();
  api.mark('expo-router:page-preloaded', pageDetail);
  const lists: PerformanceObserverEntryList[] = [];
  new api.unstable_PerformanceObserver((list) => lists.push(list)).observe({
    type: 'mark',
    buffered: true,
  });

  api.mark('expo-router:page-focused', pageDetail);

  expect(lists[0]?.getEntries().map((entry) => entry.name)).toEqual(['expo-router:page-preloaded']);
});
