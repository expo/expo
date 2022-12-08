import { stripAnsi } from '../../../../utils/ansi';
import { formatDeviceChoice } from '../promptDevice';

describe(formatDeviceChoice, () => {
  it(`formats USB connected device`, () => {
    const option = formatDeviceChoice({
      name: "Evan's phone",
      model: 'iPhone13,4',
      osVersion: '15.4.1',
      deviceType: 'device',
      connectionType: 'USB',
      udid: '00008101-001964A22629003A',
    });

    expect(stripAnsi(option.title)).toEqual(`🔌 Evan's phone (15.4.1)`);
    expect(stripAnsi(option.value)).toEqual('00008101-001964A22629003A');
  });
  it(`formats network connected device`, () => {
    const option = formatDeviceChoice({
      name: "Evan's phone",
      model: 'iPhone13,4',
      osVersion: '15.4.1',
      deviceType: 'device',
      connectionType: 'Network',
      udid: '00008101-001964A22629003A',
    });

    expect(stripAnsi(option.title)).toEqual(`🌐 Evan's phone (15.4.1)`);
    expect(stripAnsi(option.value)).toEqual('00008101-001964A22629003A');
  });
  it(`formats active simulator`, () => {
    const option = formatDeviceChoice({
      dataPath:
        '/Users/evanbacon/Library/Developer/CoreSimulator/Devices/ADEF1A93-5D20-40C3-826C-5A4E04DBBB52/data',
      dataPathSize: 2811236352,
      logPath: '/Users/evanbacon/Library/Logs/CoreSimulator/ADEF1A93-5D20-40C3-826C-5A4E04DBBB52',
      udid: 'ADEF1A93-5D20-40C3-826C-5A4E04DBBB52',
      isAvailable: true,
      logPathSize: 479232,
      deviceTypeIdentifier: 'com.apple.CoreSimulator.SimDeviceType.iPhone-8',
      state: 'Booted',
      name: 'iPhone 8',
      runtime: 'com.apple.CoreSimulator.SimRuntime.iOS-15-4',
      osVersion: '15.4',
      windowName: 'iPhone 8 (15.4)',
      osType: 'iOS',
    });

    expect(stripAnsi(option.title)).toEqual(`iPhone 8 (15.4)`);
    expect(stripAnsi(option.value)).toEqual('ADEF1A93-5D20-40C3-826C-5A4E04DBBB52');
  });
  it(`formats closed simulator`, () => {
    const option = formatDeviceChoice({
      dataPath:
        '/Users/evanbacon/Library/Developer/CoreSimulator/Devices/4DE5F2E1-C6FF-4CCE-BD27-7D40E2674066/data',
      dataPathSize: 13316096,
      logPath: '/Users/evanbacon/Library/Logs/CoreSimulator/4DE5F2E1-C6FF-4CCE-BD27-7D40E2674066',
      udid: '4DE5F2E1-C6FF-4CCE-BD27-7D40E2674066',
      isAvailable: true,
      deviceTypeIdentifier: 'com.apple.CoreSimulator.SimDeviceType.iPhone-8-Plus',
      state: 'Shutdown',
      name: 'iPhone 8 Plus',
      runtime: 'com.apple.CoreSimulator.SimRuntime.iOS-15-4',
      osVersion: '15.4',
      windowName: 'iPhone 8 Plus (15.4)',
      osType: 'iOS',
    });

    expect(stripAnsi(option.title)).toEqual(`iPhone 8 Plus (15.4)`);
    expect(stripAnsi(option.value)).toEqual('4DE5F2E1-C6FF-4CCE-BD27-7D40E2674066');
  });
});
