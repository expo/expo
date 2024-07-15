import { getBuildNumber, getVersion, setBuildNumber, setVersion } from '../Version';

describe('version', () => {
  it(`uses version if it's given in config`, () => {
    expect(getVersion({ version: '1.2.3' })).toBe('1.2.3');
  });

  it(`uses 1.0.0 if no version is given`, () => {
    expect(getVersion({})).toBe('1.0.0');
  });

  it(`sets the CFBundleShortVersionString`, () => {
    expect(setVersion({ version: '0.0.1' }, {})).toMatchObject({
      CFBundleShortVersionString: '0.0.1',
    });
  });
});

describe('build number', () => {
  it(`uses macos.buildNumber if it's given in config`, () => {
    expect(getBuildNumber({ macos: { buildNumber: '12' } })).toEqual('12');
  });

  it(`falls back to '1' if not provided`, () => {
    expect(getBuildNumber({ macos: { buildNumber: null } })).toEqual('1');
    expect(getBuildNumber({})).toEqual('1');
  });

  it(`sets the CFBundleVersion`, () => {
    expect(setBuildNumber({ macos: { buildNumber: '21' } }, {})).toMatchObject({
      CFBundleVersion: '21',
    });
  });
});
