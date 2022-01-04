import { ensureValidPlatforms } from '../platformOptions';

describe(ensureValidPlatforms, () => {
  const platform = process.platform;

  afterEach(() => {
    Object.defineProperty(process, 'platform', {
      value: platform,
    });
  });
  it(`bails on windows if only ios is passed`, async () => {
    Object.defineProperty(process, 'platform', {
      value: 'win32',
    });
    expect(ensureValidPlatforms(['ios', 'android'])).toStrictEqual(['android']);
  });
  it(`allows ios on all platforms except windows`, async () => {
    Object.defineProperty(process, 'platform', {
      value: 'other',
    });
    expect(ensureValidPlatforms(['ios', 'android'])).toStrictEqual(['ios', 'android']);
  });
});
