import { NativeModulesProxy } from 'expo-core';
import ThreeAxisSensor from './ThreeAxisSensor';
const { ExponentAccelerometer } = NativeModulesProxy;
export default new ThreeAxisSensor(ExponentAccelerometer, 'accelerometerDidUpdate');
//# sourceMappingURL=Accelerometer.js.map