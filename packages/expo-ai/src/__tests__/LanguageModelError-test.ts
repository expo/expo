import { LanguageModelError, normalizeError } from '../LanguageModelError';

describe('normalizeError', () => {
  it('maps a native code independently of the call site fallback', () => {
    // Android throws ERR_AVAILABILITY_FAILED (ExpoAIModule.kt). The table must resolve it on its
    // own, not because getAvailabilityAsync happens to pass the same code as its fallback.
    const error = normalizeError(
      { code: 'ERR_AVAILABILITY_FAILED', message: 'Could not read availability.' },
      'ERR_GENERATION_FAILED'
    );

    expect(error.code).toBe('ERR_AVAILABILITY_FAILED');
    expect(error.message).toBe('Could not read availability.');
  });

  it('passes a LanguageModelError through unchanged', () => {
    const cause = new LanguageModelError('ERR_AVAILABILITY_FAILED', 'Already normalized.');

    expect(normalizeError(cause, 'ERR_GENERATION_FAILED')).toBe(cause);
  });

  it('falls back when the native code is unknown', () => {
    const error = normalizeError({ code: 'ERR_SOMETHING_ELSE' }, 'ERR_GENERATION_FAILED');

    expect(error.code).toBe('ERR_GENERATION_FAILED');
  });
});
