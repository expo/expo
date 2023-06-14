import { AppLaunchMode } from '../server/AppLaunchMode';
import { resolveAppLaunchMode } from '../startAsync';

describe('resolveAppLaunchMode', () => {
  it('should return `Start` when given `{ customized: false, expoGoCompatible: false, devClientInstalled: false }`', () => {
    expect(
      resolveAppLaunchMode({
        customized: false,
        expoGoCompatible: false,
        devClientInstalled: false,
      })
    ).toBe(AppLaunchMode.Start);
  });

  it('should return `OpenDeepLinkDevClient` when given `{ customized: false, expoGoCompatible: false, devClientInstalled: true }`', () => {
    expect(
      resolveAppLaunchMode({ customized: false, expoGoCompatible: false, devClientInstalled: true })
    ).toBe(AppLaunchMode.OpenDeepLinkDevClient);
  });

  it('should return `OpenDeepLinkExpoGo` when given `{ customized: false, expoGoCompatible: true, devClientInstalled: false }`', () => {
    expect(
      resolveAppLaunchMode({ customized: false, expoGoCompatible: true, devClientInstalled: false })
    ).toBe(AppLaunchMode.OpenDeepLinkExpoGo);
  });

  it('should return `OpenRedirectPage` when given `{ customized: false, expoGoCompatible: true, devClientInstalled: true }`', () => {
    expect(
      resolveAppLaunchMode({ customized: false, expoGoCompatible: true, devClientInstalled: true })
    ).toBe(AppLaunchMode.OpenRedirectPage);
  });

  it('should return `Start` when given `{ customized: true, expoGoCompatible: false, devClientInstalled: false }`', () => {
    expect(
      resolveAppLaunchMode({ customized: true, expoGoCompatible: false, devClientInstalled: false })
    ).toBe(AppLaunchMode.Start);
  });

  it('should return `OpenDeepLinkDevClient` when given `{ customized: true, expoGoCompatible: false, devClientInstalled: true }`', () => {
    expect(
      resolveAppLaunchMode({ customized: true, expoGoCompatible: false, devClientInstalled: true })
    ).toBe(AppLaunchMode.OpenDeepLinkDevClient);
  });

  it('should return `OpenDeepLinkExpoGo` when given `{ customized: true, expoGoCompatible: true, devClientInstalled: false }`', () => {
    expect(
      resolveAppLaunchMode({ customized: true, expoGoCompatible: true, devClientInstalled: false })
    ).toBe(AppLaunchMode.OpenDeepLinkExpoGo);
  });

  it('should return `OpenDeepLinkDevClient` when given `{ customized: true, expoGoCompatible: true, devClientInstalled: true }`', () => {
    expect(
      resolveAppLaunchMode({ customized: true, expoGoCompatible: true, devClientInstalled: true })
    ).toBe(AppLaunchMode.OpenDeepLinkDevClient);
  });

  it('should throw from invalid `--app-launch-mode`', () => {
    expect(() => {
      resolveAppLaunchMode(
        { customized: false, expoGoCompatible: true, devClientInstalled: true },
        { appLaunchMode: 'invalid-option' }
      );
    }).toThrow();
  });

  it('should override the projectState heuristic when specifiying `--dev-client` as backward compatibility', () => {
    expect(
      resolveAppLaunchMode(
        { customized: false, expoGoCompatible: true, devClientInstalled: true },
        { devClient: true }
      )
    ).toBe(AppLaunchMode.OpenDeepLinkDevClient);

    expect(
      resolveAppLaunchMode(
        { customized: false, expoGoCompatible: true, devClientInstalled: false },
        { devClient: true }
      )
    ).toBe(AppLaunchMode.Start);
  });
});
