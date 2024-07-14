import * as AppleImpl from '../apple/DeviceFamily';

export const withDeviceFamily = AppleImpl.withDeviceFamily('macos');

export const getSupportsTablet = AppleImpl.getSupportsTablet('macos');

export const getIsTabletOnly = AppleImpl.getIsTabletOnly('macos');

export const getDeviceFamilies = AppleImpl.getDeviceFamilies('macos');

export const setDeviceFamily = AppleImpl.setDeviceFamily('macos');

export { formatDeviceFamilies } from '../apple/DeviceFamily';
