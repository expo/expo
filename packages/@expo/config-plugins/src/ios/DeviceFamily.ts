import * as AppleImpl from '../apple/DeviceFamily';

export const withDeviceFamily = AppleImpl.withDeviceFamily('ios');

export const getSupportsTablet = AppleImpl.getSupportsTablet('ios');

export const getIsTabletOnly = AppleImpl.getIsTabletOnly('ios');

export const getDeviceFamilies = AppleImpl.getDeviceFamilies('ios');

export const setDeviceFamily = AppleImpl.setDeviceFamily('ios');

export { formatDeviceFamilies } from '../apple/DeviceFamily';