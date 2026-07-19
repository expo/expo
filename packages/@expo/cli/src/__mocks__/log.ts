export const time = jest.fn();

export const timeEnd = jest.fn();

export const error = jest.fn();

export const exception = jest.fn();

export const warn = jest.fn();

export const log = jest.fn();

export const debug = jest.fn();

export const clear = jest.fn();

export const exit = jest.fn(() => {
  throw new Error('EXIT_CALLED');
});

export const Log = {
  time,
  timeEnd,
  error,
  exception,
  warn,
  log,
  debug,
  clear,
  exit,
};
