import * as android from './Android';
export { android };
export * from './errors';
export * from './Bluetooth';
export * from './permissions';
export * from './Bluetooth.types';
let hasWarned = false;
if (!hasWarned) {
    hasWarned = true;
    console.warn('expo-bluetooth is in very early beta, use at your own discretion!');
}
//# sourceMappingURL=index.js.map