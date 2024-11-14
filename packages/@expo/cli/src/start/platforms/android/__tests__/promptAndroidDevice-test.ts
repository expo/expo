import { stripAnsi } from '../../../../utils/ansi';
import { formatDeviceChoice } from '../promptAndroidDevice';

describe(formatDeviceChoice, () => {
  it('formats Network connected authorized device', () => {
    const choice = formatDeviceChoice({
      pid: 'adb-99999XXX999XXX-XxXxxx._adb-tls-connect._tcp.',
      name: `Pixel_7_Pro`,
      type: `device`,
      connectionType: `Network`,
      isBooted: true,
      isAuthorized: true,
    });

    expect(stripAnsi(choice.title)).toBe(`🌐 Pixel_7_Pro (device)`);
    expect(stripAnsi(choice.value)).toBe(`Pixel_7_Pro`);
  });

  it('formats Network connected unauthorized device', () => {
    const choice = formatDeviceChoice({
      pid: 'adb-99999XXX999XXX-XxXxxx._adb-tls-connect._tcp.',
      name: `Pixel_7_Pro`,
      type: `device`,
      connectionType: `Network`,
      isBooted: true,
      isAuthorized: false,
    });

    expect(stripAnsi(choice.title)).toBe(`🌐 Pixel_7_Pro (unauthorized)`);
    expect(stripAnsi(choice.value)).toBe(`Pixel_7_Pro`);
  });

  it('formats USB connected authorized device', () => {
    const choice = formatDeviceChoice({
      pid: '99999XXX999XXX',
      name: `Pixel_7_Pro`,
      type: `device`,
      connectionType: `USB`,
      isBooted: true,
      isAuthorized: true,
    });

    expect(stripAnsi(choice.title)).toBe(`🔌 Pixel_7_Pro (device)`);
    expect(stripAnsi(choice.value)).toBe(`Pixel_7_Pro`);
  });

  it('formats USB connected unauthorized device', () => {
    const choice = formatDeviceChoice({
      pid: '99999XXX999XXX',
      name: `Pixel_7_Pro`,
      type: `device`,
      connectionType: `USB`,
      isBooted: true,
      isAuthorized: false,
    });

    expect(stripAnsi(choice.title)).toBe(`🔌 Pixel_7_Pro (unauthorized)`);
    expect(stripAnsi(choice.value)).toBe(`Pixel_7_Pro`);
  });

  it('formats booted emulator', () => {
    const choice = formatDeviceChoice({
      pid: 'emulator-5554',
      name: `Pixel_6_API_33`,
      type: `emulator`,
      isBooted: true,
      isAuthorized: true,
    });

    expect(stripAnsi(choice.title)).toBe(`Pixel_6_API_33 (emulator)`);
    expect(stripAnsi(choice.value)).toBe(`Pixel_6_API_33`);
  });

  it('formats non-booted emulator', () => {
    const choice = formatDeviceChoice({
      pid: 'emulator-5554',
      name: `Pixel_6_API_33`,
      type: `emulator`,
      isBooted: false,
      isAuthorized: true,
    });

    expect(stripAnsi(choice.title)).toBe(`Pixel_6_API_33 (emulator)`);
    expect(stripAnsi(choice.value)).toBe(`Pixel_6_API_33`);
  });
});
