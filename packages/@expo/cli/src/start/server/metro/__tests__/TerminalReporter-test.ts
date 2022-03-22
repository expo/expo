import { TerminalReporter } from '../TerminalReporter';
import { TerminalReportableEvent } from '../TerminalReporter.types';

function createReporter() {
  const reporter = new TerminalReporter({
    log: jest.fn(),
    persistStatus: jest.fn(),
    status: jest.fn(),
  });
  return reporter;
}

it(`invokes utility transform cache reset function`, () => {
  const reporter = createReporter();
  reporter.transformCacheReset = jest.fn();
  reporter._log({
    type: 'transform_cache_reset',
  });
  expect(reporter.transformCacheReset).toHaveBeenCalled();
});
it(`invokes utility graph loading function`, () => {
  const reporter = createReporter();
  reporter.dependencyGraphLoading = jest.fn();
  reporter._log({
    type: 'dep_graph_loading',
    hasReducedPerformance: true,
  });
  expect(reporter.dependencyGraphLoading).toHaveBeenCalledWith(true);
});
it(`invokes utility filter function`, () => {
  const reporter = createReporter();

  reporter.shouldFilterClientLog = jest.fn();
  const event: TerminalReportableEvent = {
    type: 'client_log',
    level: 'trace',
    data: [],
  };
  reporter._log(event);
  expect(reporter.shouldFilterClientLog).toHaveBeenCalledWith(event);
  expect(reporter.terminal.log).toBeCalled();
});
it(`skips logging if the filter function returns true`, () => {
  const reporter = createReporter();

  reporter.shouldFilterClientLog = jest.fn(() => true);
  const event: TerminalReportableEvent = {
    type: 'client_log',
    level: 'trace',
    data: [],
  };
  reporter._log(event);
  expect(reporter.shouldFilterClientLog).toHaveBeenCalledWith(event);
  expect(reporter.terminal.log).not.toBeCalled();
});
