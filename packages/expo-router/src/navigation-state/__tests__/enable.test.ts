import {
  __resetNewStateModelForTests,
  enableNewStateModel,
  isNewStateModelEnabled,
} from '../enable';

// R-Phase A — the opt-in flag (Decisions R-3). Read at render / per-dispatch, never at module eval.

afterEach(__resetNewStateModelForTests);

describe('enableNewStateModel', () => {
  it('defaults to off', () => {
    expect(isNewStateModelEnabled()).toBe(false);
  });

  it('turns the new model on', () => {
    enableNewStateModel();
    expect(isNewStateModelEnabled()).toBe(true);
  });

  it('is idempotent', () => {
    enableNewStateModel();
    enableNewStateModel();
    expect(isNewStateModelEnabled()).toBe(true);
  });
});
