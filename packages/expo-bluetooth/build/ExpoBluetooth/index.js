import ExpoBluetooth from './ExpoBluetooth';
import platformModuleWithCustomErrors from './transformPlatformModule';
const wrappedPlatformModule = platformModuleWithCustomErrors(ExpoBluetooth);
export default wrappedPlatformModule;
export const { UUID } = ExpoBluetooth;
export const DELIMINATOR = '|';
export const EVENTS = ExpoBluetooth.EVENTS;
//# sourceMappingURL=index.js.map