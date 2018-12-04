import { NativeModulesProxy } from 'expo-core';
import ThreeAxisSensor from './ThreeAxisSensor';
const { ExponentGyroscope } = NativeModulesProxy;
export default new ThreeAxisSensor(ExponentGyroscope, 'gyroscopeDidUpdate');
//# sourceMappingURL=Gyroscope.js.map