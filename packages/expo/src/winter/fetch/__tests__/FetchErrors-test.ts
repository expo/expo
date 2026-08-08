/// <reference types="node" />

/** @jest-environment node */

import { DOMException } from '../../DOMException';
import { createAbortError, FetchError } from '../FetchErrors';

describe('FetchError', () => {
  it('carries a name so callers can tell it apart from other errors', () => {
    const error = new FetchError('The network connection was lost.');
    expect(error.name).toBe('FetchError');
    expect(error.message).toBe('fetch failed: The network connection was lost.');
  });

  it('keeps the name, cause and stack when created from another error', () => {
    const cause = new Error('root cause');
    const source = new Error('The network connection was lost.', { cause });
    const error = FetchError.createFromError(source);

    expect(error.name).toBe('FetchError');
    expect(error.message).toBe('fetch failed: The network connection was lost.');
    expect(error.cause).toBe(cause);
    expect(error.stack).toBe(source.stack);
  });
});

describe('createAbortError', () => {
  it('returns the reason the signal was aborted with', () => {
    const controller = new AbortController();
    const reason = new Error('replaced by a newer request');
    controller.abort(reason);

    expect(createAbortError(controller.signal)).toBe(reason);
  });

  it('passes a nullish reason through instead of replacing it', () => {
    const controller = new AbortController();
    controller.abort(null);

    expect(createAbortError(controller.signal)).toBeNull();
  });

  it('falls back to an AbortError when the signal has no reason', () => {
    // React Native's AbortController polyfill does not implement `reason`.
    const signal = { aborted: true } as unknown as AbortSignal;
    const error = createAbortError(signal) as DOMException;

    expect(error).toBeInstanceOf(DOMException);
    expect(error.name).toBe('AbortError');
    expect(error.code).toBe(20);
    expect(error.message).toBe('The operation was aborted.');
  });

  it('falls back to an AbortError when there is no signal', () => {
    expect((createAbortError() as DOMException).name).toBe('AbortError');
  });
});
