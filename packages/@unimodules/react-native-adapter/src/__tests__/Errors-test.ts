import { UnavailabilityError } from '../errors/UnavailabilityError';

describe('UnavailabilityError', () => {
  it(`has a constructor which takes a module and property name as parameters`, () => {
    let err = new UnavailabilityError('TestModule', 'someProperty');
    expect(err.code).toBe('ERR_UNAVAILABLE');
    expect(err.message).toContain('TestModule');
    expect(err.message).toContain('someProperty');
  });
});
