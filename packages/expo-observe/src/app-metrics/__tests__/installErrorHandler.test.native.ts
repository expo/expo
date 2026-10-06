/* eslint-disable @typescript-eslint/no-require-imports */
export {};

const mockAppMetrics = {
  reportError: jest.fn(),
};

jest.mock('../module', () => ({
  __esModule: true,
  default: mockAppMetrics,
}));

type GlobalHandler = (error: any, isFatal?: boolean) => void;

let previousHandler: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
  jest.doMock('../module', () => ({ __esModule: true, default: mockAppMetrics }));

  previousHandler = jest.fn();
  let currentHandler: GlobalHandler = previousHandler;
  (globalThis as any).ErrorUtils = {
    getGlobalHandler: () => currentHandler,
    setGlobalHandler: (handler: GlobalHandler) => {
      currentHandler = handler;
    },
  };
});

afterEach(() => {
  delete (globalThis as any).ErrorUtils;
});

function loadModule() {
  return require('../installErrorHandler') as typeof import('../installErrorHandler');
}

/** Installs the handler and returns the one now registered on `ErrorUtils`. */
function installAndGetHandler(module: ReturnType<typeof loadModule>): GlobalHandler {
  module.installErrorHandler();
  return (globalThis as any).ErrorUtils.getGlobalHandler();
}

describe('setErrorHandlerEnabled', () => {
  it('reports errors by default', () => {
    const module = loadModule();
    const handler = installAndGetHandler(module);
    handler(new Error('boom'), true);
    expect(mockAppMetrics.reportError).toHaveBeenCalledTimes(1);
    expect(mockAppMetrics.reportError).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'global', message: 'boom', isFatal: true })
    );
  });

  it('stops reporting when disabled', () => {
    const module = loadModule();
    const handler = installAndGetHandler(module);
    module.setErrorHandlerEnabled(false);
    handler(new Error('boom'), true);
    expect(mockAppMetrics.reportError).not.toHaveBeenCalled();
  });

  it('still chains to the previous handler when disabled', () => {
    const module = loadModule();
    const handler = installAndGetHandler(module);
    module.setErrorHandlerEnabled(false);
    const error = new Error('boom');
    handler(error, true);
    expect(previousHandler).toHaveBeenCalledTimes(1);
    expect(previousHandler).toHaveBeenCalledWith(error, true);
  });

  it('resumes reporting when re-enabled', () => {
    const module = loadModule();
    const handler = installAndGetHandler(module);
    module.setErrorHandlerEnabled(false);
    handler(new Error('dropped'), false);
    expect(mockAppMetrics.reportError).not.toHaveBeenCalled();
    module.setErrorHandlerEnabled(true);
    handler(new Error('recorded'), false);
    expect(mockAppMetrics.reportError).toHaveBeenCalledTimes(1);
    expect(mockAppMetrics.reportError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'recorded' })
    );
  });

  it('takes effect for a handler installed before the call, since install happens at import time', () => {
    const module = loadModule();
    module.setErrorHandlerEnabled(false);
    const handler = installAndGetHandler(module);
    handler(new Error('boom'), false);
    expect(mockAppMetrics.reportError).not.toHaveBeenCalled();
  });
});
